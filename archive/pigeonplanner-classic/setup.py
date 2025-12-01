#!/usr/bin/env python
# -*- coding: utf-8 -*-

# This file is part of Pigeon Planner.

# Pigeon Planner is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.

# Pigeon Planner is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.

# You should have received a copy of the GNU General Public License
# along with Pigeon Planner.  If not, see <http://www.gnu.org/licenses/>


"""
This is the Pigeon Planner setup script
"""

import os
import sys
import glob
import shutil
from setuptools import setup, find_packages

from pigeonplanner.core import const


# Common data files
glade_files = glob.glob("glade/*.ui")
glade_files.extend(["glade/pigeonplannerwidgets.py", "glade/pigeonplannerwidgets.xml"])

translation_files = []
# Search for the translation files
for mofile in glob.glob("languages/*/LC_MESSAGES/pigeonplanner.mo"):
    _, lang, _ = mofile.split(os.sep, 2)
    modir = os.path.dirname(mofile)
    if sys.platform != "win32":
        modir = modir.replace("languages", "share/pigeonplanner/languages")
    translation_files.append((modir, [mofile]))

resultparsers = glob.glob("resultparsers/*.py")
resultparsers.extend(glob.glob("resultparsers/*.yapsy-plugin"))

options = {"py2exe": {"compressed": 2,
                      "optimize": 2,
                      "includes": ["atk", "cairo", "gio", "gobject", "pango", "pangocairo"],
                      "excludes": ["_gtkagg", "_tkagg", "bsddb", "curses",
                                   "email", "pywin.debugger",
                                   "pywin.debugger.dbgcon", "pywin.dialogs",
                                   "tcl", "Tkconstants", "Tkinter"],
                      "packages": ["encodings", "pigeonplanner"],
                      "dll_excludes": ["tcl84.dll", "tk84.dll", "w9xpopen.exe"],
                      "bundle_files": 3,
                      "dist_dir": "dist",
                      "xref": False,
                      "skip_archive": False,
                      "ascii": False,
                     }
          }

if sys.platform == "win32":
    import py2exe

    data_files = [
            ("glade", glade_files),
            ("images", glob.glob("images/*.png")),
            ("resultparsers", resultparsers),
            (".", ["AUTHORS", "CHANGES", "COPYING", "README", "README.dev"])]

    platform_options = dict(
                    zipfile = r"lib/library.zip",
                    windows = [{"script" : "pigeonplanner.py",
                                "icon_resources": [(1, "win/pigeonplanner.ico")],
                            }]
                        )
else:
    data_files = [
            ("share/pigeonplanner/glade", glade_files),
            ("share/pigeonplanner/images", glob.glob("images/*.png")),
            ("share/pigeonplanner/resultparsers", resultparsers),
            ("share/applications", ["data/pigeonplanner.desktop"]),
            ("share/icons/hicolor/scalable/apps", ["images/pigeonplanner.svg"]),
            ("share/pixmaps/", ["images/pigeonplanner.png"]),
            ]
    platform_options = {}


entry_points = {
        "gui_scripts": [
            "pigeonplanner = pigeonplanner.main:run"
            ]
        }

setup(name = "pigeonplanner",
      version = const.VERSION,
      description = const.DESCRIPTION,
      long_description = """
            Pigeon Planner is a pigeon organiser which lets the user 
            manage their pigeons with their details, pedigree, 
            results and more.""",
      author = "Timo Vanwynsberghe",
      author_email = "timovwb@gmail.com",
      download_url = "http://www.pigeonplanner.com/download",
      license = "GPLv3",
      url = const.WEBSITE,
      packages = find_packages(),
      data_files = data_files + translation_files,
      entry_points = entry_points,
      options = options,
      **platform_options
    )

# Remove egg-info directory which is no longer needed
try:
    shutil.rmtree("pigeonplanner.egg-info")
except:
    pass
