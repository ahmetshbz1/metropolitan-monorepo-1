import os
from pathlib import Path
import random
from datetime import datetime, timedelta

HEADER_TEMPLATE = """//  "{filename}"
//  metropolitan app
//  Created by Ahmet on {date}.
"""

MOBILE_APP_DIR = Path(__file__).resolve().parent.parent
EXTENSIONS = {'.ts', '.tsx', '.js'}

START_DATE = datetime(2025, 6, 1)
END_DATE = datetime(2025, 7, 12)

def random_date():
    delta = END_DATE - START_DATE
    random_days = random.randint(0, delta.days)
    date = START_DATE + timedelta(days=random_days)
    return date.strftime('%d.%m.%Y')

def strip_existing_header(lines, filename):
    header_first_line = f'//  "{filename}"'
    if lines and header_first_line in lines[0]:
        # Eski başlık bloğunu (ilk 3 satır) kaldır
        return lines[3:] if len(lines) > 3 else []
    return lines

def add_or_replace_header(file_path):
    filename = os.path.basename(file_path)
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    lines = strip_existing_header(lines, filename)
    header = HEADER_TEMPLATE.format(filename=filename, date=random_date())
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(header)
        if lines and lines[0].strip() != '':
            f.write('\n')
        f.writelines(lines)
    return True

def main():
    updated = 0
    for root, dirs, files in os.walk(MOBILE_APP_DIR):
        dirs[:] = [d for d in dirs if d != 'node_modules']
        for file in files:
            ext = os.path.splitext(file)[1]
            if ext not in EXTENSIONS:
                continue
            if file.endswith('.d.ts'):
                continue
            if file.endswith('.json'):
                continue
            file_path = os.path.join(root, file)
            if add_or_replace_header(file_path):
                print(f"Header güncellendi: {file_path}")
                updated += 1
    print(f"Toplam {updated} dosyada header güncellendi.")

if __name__ == "__main__":
    main()
