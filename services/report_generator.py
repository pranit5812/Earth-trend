"""
EarthTrend India - Scientific PDF Report Generator
Generates publication-quality downloadable PDF scientific reports using ReportLab:
- NASA mission metadata & data quality information
- Mann-Kendall and Sen's slope statistical findings
- Climatological anomalies
- Methodological documentation & limitations
- Registered in SQLite database
"""

import os
import uuid
from datetime import datetime
from typing import Dict, Any

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, HRFlowable
from reportlab.pdfgen import canvas

from services.cache_db import register_report, get_report_by_id, DB_PATH
from services.data_service import get_series_for_region, VARIABLE_CONFIG
from services.trend_engine import comprehensive_trend_analysis

if os.environ.get("VERCEL") or (os.path.exists("/tmp") and not os.access(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), os.W_OK)):
    REPORTS_DIR = os.path.join("/tmp", "reports")
else:
    REPORTS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "reports")
os.makedirs(REPORTS_DIR, exist_ok=True)


class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_number(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_page_number(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 9)
        self.setFillColor(colors.HexColor("#64748b"))
        # Header line
        self.drawString(54, 755, "EarthTrend India — Earth System Trend Detective (NASA Space Apps Challenge 2026)")
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.5)
        self.line(54, 747, 540, 747)
        # Footer
        self.line(54, 45, 540, 45)
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(540, 32, page_text)
        self.drawString(54, 32, "Verified NASA Mission Observations & Statistical Evaluation")
        self.restoreState()


def generate_pdf_report(region_id: str, variable: str) -> Dict[str, Any]:
    """
    Generates a scientific PDF report and records it in the database.
    """
    series = get_series_for_region(region_id, variable)
    trend = comprehensive_trend_analysis(series["dates"], series["values"], variable)
    
    report_id = f"ET-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    filename = f"{report_id}_{region_id}_{variable}.pdf"
    filepath = os.path.join(REPORTS_DIR, filename)
    
    doc = SimpleDocTemplate(
        filepath,
        pagesize=A4,
        leftMargin=54,
        rightMargin=54,
        topMargin=60,
        bottomMargin=60
    )
    
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        "ReportTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#1e3a8a"),
        spaceAfter=6
    )
    subtitle_style = ParagraphStyle(
        "ReportSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=11,
        leading=15,
        textColor=colors.HexColor("#475569"),
        spaceAfter=15
    )
    heading_style = ParagraphStyle(
        "SectionHeading",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=13,
        leading=17,
        textColor=colors.HexColor("#1e40af"),
        spaceBefore=12,
        spaceAfter=8
    )
    body_style = ParagraphStyle(
        "BodyTextCustom",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9.5,
        leading=14,
        textColor=colors.HexColor("#1e293b")
    )
    callout_style = ParagraphStyle(
        "CalloutStyle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=15,
        textColor=colors.HexColor("#0f172a")
    )

    elements = []
    
    # Title Block
    elements.append(Paragraph(f"Earth System Trend Report: {series['label']}", title_style))
    elements.append(Paragraph(
        f"<b>Region:</b> {series.get('region_name', region_id)} &nbsp;|&nbsp; "
        f"<b>Report ID:</b> {report_id} &nbsp;|&nbsp; "
        f"<b>Generated:</b> {datetime.now().strftime('%d %B %Y %H:%M UTC')}",
        subtitle_style
    ))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#3b82f6"), spaceAfter=14))
    
    # 1. Executive Summary Table
    elements.append(Paragraph("1. Executive Trend Verdict", heading_style))
    trend_color = colors.HexColor("#15803d") if trend["trend_direction"] == "Increasing" else (
        colors.HexColor("#b91c1c") if trend["trend_direction"] == "Decreasing" else colors.HexColor("#475569")
    )
    
    summary_data = [
        [Paragraph("<b>Environmental Variable:</b>", body_style), Paragraph(series["label"], body_style)],
        [Paragraph("<b>Target Region:</b>", body_style), Paragraph(series.get("region_name", region_id), body_style)],
        [Paragraph("<b>Trend Classification:</b>", body_style), Paragraph(f"<b><font color='{trend_color.hexval()}'>{trend['trend_direction']}</font></b>", callout_style)],
        [Paragraph("<b>Rate of Change (Sen's Slope):</b>", body_style), Paragraph(f"<b>{trend['annual_rate']:+.4f} {series['unit']}/year</b>", body_style)],
        [Paragraph("<b>Statistical Significance:</b>", body_style), Paragraph("<b>Statistically Significant (p < 0.05)</b>" if trend["is_significant"] else "Not Significant (p >= 0.05)", body_style)],
        [Paragraph("<b>Mann-Kendall p-value:</b>", body_style), Paragraph(f"p = {trend['p_value']:.4e} (Z = {trend['mann_kendall']['z_stat']:.2f})", body_style)],
        [Paragraph("<b>95% Confidence Interval:</b>", body_style), Paragraph(f"[{trend['confidence_interval_95']['lower']:+.4f}, {trend['confidence_interval_95']['upper']:+.4f}] {series['unit']}/year", body_style)],
        [Paragraph("<b>Temporal Coverage:</b>", body_style), Paragraph(f"{trend['date_range']['start']} to {trend['date_range']['end']} ({trend['n_observations']} points)", body_style)]
    ]
    
    t_summary = Table(summary_data, colWidths=[180, 300])
    t_summary.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#e2e8f0")),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    elements.append(t_summary)
    elements.append(Spacer(1, 14))
    
    # 2. NASA Dataset Attribution & Quality
    elements.append(Paragraph("2. NASA Dataset Provenance & Quality Flags", heading_style))
    ds_meta = series.get("dataset_meta") or {}
    dataset_table_data = [
        [Paragraph("<b>NASA Mission:</b>", body_style), Paragraph(ds_meta.get("mission", "NASA Earth Science"), body_style)],
        [Paragraph("<b>Dataset & Version:</b>", body_style), Paragraph(ds_meta.get("name", series["source"]), body_style)],
        [Paragraph("<b>Native Parameter:</b>", body_style), Paragraph(ds_meta.get("parameter", "Observed"), body_style)],
        [Paragraph("<b>Spatial Resolution:</b>", body_style), Paragraph(ds_meta.get("spatial_res", "Standard"), body_style)],
        [Paragraph("<b>Quality Control (QC):</b>", body_style), Paragraph(ds_meta.get("qc_procedure", "Standard assimilation & QA filters"), body_style)],
        [Paragraph("<b>Attribution:</b>", body_style), Paragraph(ds_meta.get("attribution", "NASA Earth System Data"), body_style)],
    ]
    t_dataset = Table(dataset_table_data, colWidths=[180, 300])
    t_dataset.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#eff6ff")),
        ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#bfdbfe")),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#dbeafe")),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    elements.append(t_dataset)
    elements.append(Spacer(1, 14))
    
    # 3. Anomaly Summary
    elements.append(Paragraph("3. Climatological Anomalies (Extreme Deviations)", heading_style))
    recent_anom = trend.get("recent_anomalies", [])
    if recent_anom:
        anom_rows = [[Paragraph("<b>Date</b>", body_style), Paragraph("<b>Observed</b>", body_style), Paragraph("<b>Baseline Mean</b>", body_style), Paragraph("<b>Anomaly</b>", body_style), Paragraph("<b>Z-Score</b>", body_style), Paragraph("<b>Severity</b>", body_style)]]
        for a in recent_anom[-5:]:
            anom_rows.append([
                Paragraph(a["date"], body_style),
                Paragraph(f"{a['value']:.2f}", body_style),
                Paragraph(f"{a['baseline_mean']:.2f}", body_style),
                Paragraph(f"{a['anomaly']:+.2f}", body_style),
                Paragraph(f"{a['z_score']:+.2f}σ", body_style),
                Paragraph(a["severity"].capitalize(), body_style)
            ])
        t_anom = Table(anom_rows, colWidths=[80, 75, 80, 80, 75, 90])
        t_anom.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#fee2e2")),
            ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#fecaca")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#fecaca")),
            ("TOPPADDING", (0, 0), (-1, -1), 3),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ]))
        elements.append(t_anom)
    else:
        elements.append(Paragraph("No anomalous observations (> 2.0σ from 30-year climatology) detected during this span.", body_style))
    elements.append(Spacer(1, 14))
    
    # 4. Scientific Methodology & Limitations
    elements.append(Paragraph("4. Scientific Methodology & Statistical Caveats", heading_style))
    elements.append(Paragraph(
        "<b>Trend Assessment:</b> Non-parametric Mann-Kendall test accounts for non-normal distribution of environmental variables. "
        "Theil-Sen slope estimator computes the median of all pairwise differences to provide an unbiased rate of change resistant to outliers. "
        "Yue-Pilon pre-whitening is applied when lag-1 autocorrelation is detected to eliminate false positives.<br/><br/>"
        "<b>Limitations:</b> Satellite observations may experience cloud obscuration, interpolation boundaries, or instrument sensor degradation. "
        "Statistical correlation does not establish causation.",
        body_style
    ))
    
    doc.build(elements, canvasmaker=NumberedCanvas)
    
    # Register in DB
    summary_text = f"{trend['trend_direction']} trend ({trend['annual_rate']:+.4f} {series['unit']}/yr, p={trend['p_value']:.4e}) for {series.get('region_name', region_id)}"
    meta_dict = {
        "report_id": report_id,
        "region_id": region_id,
        "region_name": series.get("region_name", region_id),
        "variable": variable,
        "filename": filename,
        "trend": trend["trend_direction"],
        "rate": trend["annual_rate"],
        "p_value": trend["p_value"]
    }
    register_report(
        report_id=report_id,
        title=f"EarthTrend Report - {series.get('region_name', region_id)} ({series['label']})",
        region_id=region_id,
        region_name=series.get("region_name", region_id),
        variable=variable,
        file_path=filepath,
        summary=summary_text,
        metadata=meta_dict
    )
    
    return {
        "status": "success",
        "report_id": report_id,
        "filename": filename,
        "download_url": f"/api/v1/reports/{report_id}/download",
        "summary": summary_text,
        "filepath": filepath
    }
