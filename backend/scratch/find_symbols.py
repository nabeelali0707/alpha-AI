import os
import re

search_dirs = [
    r"venv/Lib/site-packages/pydantic",
    r"venv/Lib/site-packages/pydantic_settings",
    r"venv/Lib/site-packages/typing_inspection"
]

symbols = ["_lenient_issubclass", "_typing_base", "_WithArgsTypes"]

for d in search_dirs:
    if not os.path.exists(d):
        continue
    for root, dirs, files in os.walk(d):
        for file in files:
            if file.endswith(".py"):
                path = os.path.join(root, file)
                try:
                    content = open(path, "r", encoding="utf-8").read()
                    for sym in symbols:
                        if sym in content:
                            # Print matching lines
                            for i, line in enumerate(content.splitlines(), 1):
                                if sym in line:
                                    print(f"{path}:{i}: {line.strip()}")
                except Exception as e:
                    pass
