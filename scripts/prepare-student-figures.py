"""Compatibility entry point: approved exercise exports always suppress extension lines.

Private vector PDF sources are read in memory; public output is WebP only.
The authoritative implementation preserves original geometry and all dimension
values, dimension lines and architectural diagonal ticks.
"""
from pathlib import Path
import runpy

runpy.run_path(str(Path(__file__).with_name('suppress-exercise-dimension-extensions.py')), run_name='__main__')
