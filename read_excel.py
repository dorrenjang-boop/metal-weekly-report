import pandas as pd
import json

file_path = r"C:\Users\DHJANG\.gemini\A65PM_E_8_IN718_1782440060.xlsx"
try:
    # Read first without skiprows to see the structure
    df_raw = pd.read_excel(file_path, nrows=10)
    
    # Try with skiprows=1
    df = pd.read_excel(file_path, skiprows=1, nrows=10)
    
    data = {
        "columns_raw": list(df_raw.columns),
        "data_raw": df_raw.head(3).astype(str).to_dict('records'),
        "columns_skip1": list(df.columns),
        "data_skip1": df.head(3).astype(str).to_dict('records')
    }
    
    with open('excel_out.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
except Exception as e:
    with open('excel_out.json', 'w', encoding='utf-8') as f:
        json.dump({"error": str(e)}, f, ensure_ascii=False)
