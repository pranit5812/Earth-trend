import os
import sqlite3
import json
import shutil
from datetime import datetime
from typing import List, Dict, Optional, Any

_ORIGINAL_DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "earthtrend_cache.db")

# In serverless environments like Vercel or AWS Lambda, the root deployment directory is read-only.
# We ensure the SQLite database can be written to by staging it in /tmp if running on Vercel.
if os.environ.get("VERCEL") or (os.path.exists("/tmp") and not os.access(os.path.dirname(_ORIGINAL_DB_PATH) or ".", os.W_OK)):
    _TMP_DB_PATH = os.path.join("/tmp", "earthtrend_cache.db")
    if os.path.exists(_ORIGINAL_DB_PATH) and not os.path.exists(_TMP_DB_PATH):
        try:
            shutil.copy2(_ORIGINAL_DB_PATH, _TMP_DB_PATH)
        except Exception:
            pass
    DB_PATH = _TMP_DB_PATH if os.path.exists(_TMP_DB_PATH) else _ORIGINAL_DB_PATH
else:
    DB_PATH = _ORIGINAL_DB_PATH

NASA_DATASETS_META = [
    {
        "id": "NASA_POWER_T2M",
        "variable": "temperature",
        "name": "NASA POWER – T2M",
        "mission": "NASA POWER (Prediction of Worldwide Energy Resources)",
        "parameter": "T2M",
        "description": "Temperature at 2 Meters above the ground",
        "unit": "°C",
        "temporal_res": "Daily / Monthly",
        "spatial_res": "0.5° x 0.625° (~50 km)",
        "coverage_start": "1981-01-01",
        "coverage_end": "Present (near real-time)",
        "qc_procedure": "GMAO MERRA-2 assimilation, automated spatial gap-filling and boundary consistency checks",
        "attribution": "NASA Langley Research Center POWER Project"
    },
    {
        "id": "NASA_GPM_IMERG_V07",
        "variable": "rainfall",
        "name": "NASA GPM IMERG Final Run V07",
        "mission": "Global Precipitation Measurement (GPM)",
        "parameter": "precipitationCal",
        "description": "Calibrated multi-satellite precipitation estimate with gauge calibration",
        "unit": "mm/day",
        "temporal_res": "Daily / Monthly",
        "spatial_res": "0.1° x 0.1° (~10 km)",
        "coverage_start": "2000-06-01",
        "coverage_end": "Present (with 3.5-month latency for Final Run)",
        "qc_procedure": "Gauge-adjusted calibration using GPCC monthly rain-gauge data, microwave-infrared blending",
        "attribution": "NASA Goddard Space Flight Center, GPM Mission Team"
    },
    {
        "id": "NASA_SMAP_L4_SMGP",
        "variable": "soil_moisture",
        "name": "NASA SMAP L4 SPL4SMGP",
        "mission": "Soil Moisture Active Passive (SMAP)",
        "parameter": "sm_rootzone / sm_surface",
        "description": "Global 9-km Surface & Root-Zone Soil Moisture Geophysical Data",
        "unit": "m³/m³ (volumetric fraction)",
        "temporal_res": "Daily (daily mean of 3-hr assimilation)",
        "spatial_res": "9 km (EASE-Grid 2.0)",
        "coverage_start": "2015-03-31",
        "coverage_end": "Present",
        "qc_procedure": "Ensemble Kalman filter assimilation of SMAP L-band brightness temperatures into Catchment land surface model",
        "attribution": "NASA Goddard Earth Sciences Data and Information Services Center (GES DISC)"
    },
    {
        "id": "NASA_MODIS_MOD13Q1_V61",
        "variable": "vegetation",
        "name": "NASA MODIS MOD13Q1 V6.1",
        "mission": "Terra / Aqua MODIS",
        "parameter": "_250m_16_days_NDVI",
        "description": "Normalized Difference Vegetation Index (NDVI) 250m 16-Day composite",
        "unit": "NDVI index (-0.2 to 1.0)",
        "temporal_res": "16-day composite",
        "spatial_res": "250 m",
        "coverage_start": "2000-02-18",
        "coverage_end": "Present",
        "qc_procedure": "Atmospheric correction, view-angle normalization, cloud masking with pixel reliability rank QA flags",
        "attribution": "NASA LP DAAC (Land Processes Distributed Active Archive Center)"
    },
    {
        "id": "NASA_POWER_WS10M",
        "variable": "wind_speed",
        "name": "NASA POWER – WS10M",
        "mission": "NASA POWER / MERRA-2",
        "parameter": "WS10M",
        "description": "Wind Speed at 10 Meters above surface",
        "unit": "m/s",
        "temporal_res": "Daily / Monthly",
        "spatial_res": "0.5° x 0.625° (~50 km)",
        "coverage_start": "1981-01-01",
        "coverage_end": "Present",
        "qc_procedure": "MERRA-2 atmospheric assimilation, anemometer-standardized QA",
        "attribution": "NASA Langley Research Center POWER Project"
    },
    {
        "id": "NASA_POWER_RH2M",
        "variable": "humidity",
        "name": "NASA POWER – RH2M",
        "mission": "NASA POWER / MERRA-2",
        "parameter": "RH2M",
        "description": "Relative Humidity at 2 Meters above ground",
        "unit": "%",
        "temporal_res": "Daily / Monthly",
        "spatial_res": "0.5° x 0.625° (~50 km)",
        "coverage_start": "1981-01-01",
        "coverage_end": "Present",
        "qc_procedure": "Derived from T2M and dewpoint (T2MDEW) with physical bounds clamping (0–100%)",
        "attribution": "NASA Langley Research Center POWER Project"
    }
]


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_connection()
    c = conn.cursor()
    
    # 1. Datasets table
    c.execute("""
    CREATE TABLE IF NOT EXISTS datasets (
        id TEXT PRIMARY KEY,
        variable TEXT NOT NULL,
        name TEXT NOT NULL,
        mission TEXT NOT NULL,
        parameter TEXT NOT NULL,
        description TEXT,
        unit TEXT NOT NULL,
        temporal_res TEXT,
        spatial_res TEXT,
        coverage_start TEXT,
        coverage_end TEXT,
        qc_procedure TEXT,
        attribution TEXT
    )
    """)
    
    # 2. Regions table
    c.execute("""
    CREATE TABLE IF NOT EXISTS regions (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        state_name TEXT,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        bbox_json TEXT,
        area_sqkm REAL
    )
    """)
    
    # 3. Observations table (raw & processed NASA time-series)
    c.execute("""
    CREATE TABLE IF NOT EXISTS observations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        region_id TEXT NOT NULL,
        variable TEXT NOT NULL,
        date TEXT NOT NULL,
        value REAL,
        quality_flag TEXT DEFAULT 'VALID',
        source_dataset TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(region_id, variable, date)
    )
    """)
    c.execute("CREATE INDEX IF NOT EXISTS idx_obs_region_var ON observations(region_id, variable, date)")
    
    # 4. Trend analysis cache
    c.execute("""
    CREATE TABLE IF NOT EXISTS trend_cache (
        id TEXT PRIMARY KEY,
        region_id TEXT NOT NULL,
        region_name TEXT NOT NULL,
        variable TEXT NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        trend_direction TEXT NOT NULL,
        p_value REAL NOT NULL,
        sens_slope REAL NOT NULL,
        annual_rate REAL NOT NULL,
        is_significant INTEGER NOT NULL,
        tau REAL,
        z_stat REAL,
        conf_lower REAL,
        conf_upper REAL,
        n_observations INTEGER NOT NULL,
        raw_stats_json TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    # 5. Anomalies cache
    c.execute("""
    CREATE TABLE IF NOT EXISTS anomalies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        region_id TEXT NOT NULL,
        variable TEXT NOT NULL,
        date TEXT NOT NULL,
        observed_value REAL NOT NULL,
        baseline_mean REAL NOT NULL,
        baseline_std REAL NOT NULL,
        z_score REAL NOT NULL,
        severity TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(region_id, variable, date)
    )
    """)
    
    # 6. Reports catalog
    c.execute("""
    CREATE TABLE IF NOT EXISTS reports (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        region_id TEXT NOT NULL,
        region_name TEXT NOT NULL,
        variable TEXT NOT NULL,
        file_path TEXT NOT NULL,
        summary TEXT,
        metadata_json TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    # 7. Analysis event log
    c.execute("""
    CREATE TABLE IF NOT EXISTS analysis_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action TEXT NOT NULL,
        params_json TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    # Seed datasets metadata
    for ds in NASA_DATASETS_META:
        c.execute("""
        INSERT OR REPLACE INTO datasets (
            id, variable, name, mission, parameter, description, unit,
            temporal_res, spatial_res, coverage_start, coverage_end, qc_procedure, attribution
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            ds["id"], ds["variable"], ds["name"], ds["mission"], ds["parameter"],
            ds["description"], ds["unit"], ds["temporal_res"], ds["spatial_res"],
            ds["coverage_start"], ds["coverage_end"], ds["qc_procedure"], ds["attribution"]
        ))
    
    conn.commit()
    conn.close()


def get_all_datasets() -> List[Dict[str, Any]]:
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM datasets ORDER BY id")
    rows = [dict(r) for r in c.fetchall()]
    conn.close()
    return rows


def get_dataset_by_variable(variable: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM datasets WHERE variable = ? LIMIT 1", (variable.lower(),))
    row = c.fetchone()
    conn.close()
    return dict(row) if row else None


def save_observations_bulk(region_id: str, variable: str, dates: List[str], values: List[Optional[float]], source: str, quality_flag: str = "VALID"):
    conn = get_connection()
    c = conn.cursor()
    records = []
    for d, v in zip(dates, values):
        records.append((region_id, variable.lower(), d, v, quality_flag, source))
    c.executemany("""
    INSERT OR REPLACE INTO observations (region_id, variable, date, value, quality_flag, source_dataset)
    VALUES (?, ?, ?, ?, ?, ?)
    """, records)
    conn.commit()
    conn.close()


def get_cached_observations(region_id: str, variable: str, start_date: Optional[str] = None, end_date: Optional[str] = None) -> List[Dict[str, Any]]:
    conn = get_connection()
    c = conn.cursor()
    query = "SELECT date, value, quality_flag, source_dataset FROM observations WHERE region_id = ? AND variable = ?"
    params = [region_id, variable.lower()]
    if start_date:
        query += " AND date >= ?"
        params.append(start_date)
    if end_date:
        query += " AND date <= ?"
        params.append(end_date)
    query += " ORDER BY date ASC"
    c.execute(query, params)
    rows = [dict(r) for r in c.fetchall()]
    conn.close()
    return rows


def save_trend_cache(trend_data: Dict[str, Any]):
    conn = get_connection()
    c = conn.cursor()
    cache_id = f"{trend_data['region_id']}_{trend_data['variable']}_{trend_data['start_date']}_{trend_data['end_date']}"
    c.execute("""
    INSERT OR REPLACE INTO trend_cache (
        id, region_id, region_name, variable, start_date, end_date,
        trend_direction, p_value, sens_slope, annual_rate, is_significant,
        tau, z_stat, conf_lower, conf_upper, n_observations, raw_stats_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        cache_id,
        trend_data["region_id"],
        trend_data["region_name"],
        trend_data["variable"].lower(),
        trend_data["start_date"],
        trend_data["end_date"],
        trend_data["trend_direction"],
        trend_data["p_value"],
        trend_data["sens_slope"],
        trend_data["annual_rate"],
        1 if trend_data["is_significant"] else 0,
        trend_data.get("tau", 0.0),
        trend_data.get("z_stat", 0.0),
        trend_data.get("conf_lower", 0.0),
        trend_data.get("conf_upper", 0.0),
        trend_data["n_observations"],
        json.dumps(trend_data.get("raw_stats", {}))
    ))
    conn.commit()
    conn.close()


def get_cached_trend(region_id: str, variable: str, start_date: str, end_date: str) -> Optional[Dict[str, Any]]:
    cache_id = f"{region_id}_{variable.lower()}_{start_date}_{end_date}"
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM trend_cache WHERE id = ?", (cache_id,))
    row = c.fetchone()
    conn.close()
    if row:
        res = dict(row)
        res["is_significant"] = bool(res["is_significant"])
        if res.get("raw_stats_json"):
            res["raw_stats"] = json.loads(res["raw_stats_json"])
        return res
    return None


def register_report(report_id: str, title: str, region_id: str, region_name: str, variable: str, file_path: str, summary: str, metadata: Dict[str, Any]):
    conn = get_connection()
    c = conn.cursor()
    c.execute("""
    INSERT OR REPLACE INTO reports (id, title, region_id, region_name, variable, file_path, summary, metadata_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (report_id, title, region_id, region_name, variable, file_path, summary, json.dumps(metadata)))
    conn.commit()
    conn.close()


def get_all_reports() -> List[Dict[str, Any]]:
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM reports ORDER BY created_at DESC")
    rows = [dict(r) for r in c.fetchall()]
    conn.close()
    for r in rows:
        if r.get("metadata_json"):
            r["metadata"] = json.loads(r["metadata_json"])
    return rows


def get_report_by_id(report_id: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM reports WHERE id = ?", (report_id,))
    row = c.fetchone()
    conn.close()
    if row:
        res = dict(row)
        if res.get("metadata_json"):
            res["metadata"] = json.loads(res["metadata_json"])
        return res
    return None


# Initialize DB on load
init_db()
