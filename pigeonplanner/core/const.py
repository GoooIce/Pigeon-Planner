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
Definies all constants
"""


import os
import sys
import tempfile
from datetime import datetime

# No application imports!


VERSION_TUPLE = (2, 2, 4)
VERSION = ".".join(map(str, VERSION_TUPLE))

NAME = "Pigeon Planner"
COPYRIGHT = "(C)opyright 2009-%s Timo Vanwynsberghe" % datetime.now().year
AUTHORS = ["Timo Vanwynsberghe <timovwb@gmail.com>"]
ARTISTS = ["Timo Vanwynsberghe <timovwb@gmail.com>",
           "http://www.openclipart.org"]
WEBSITE = "http://www.pigeonplanner.com"
DESCRIPTION = "Organise and manage your pigeons"
LICENSE = """
Pigeon Planner is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Pigeon Planner is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with Pigeon Planner.  If not, see <http://www.gnu.org/licenses/>"""


UNIX = False
WINDOWS = False
OSX = False
if sys.platform.startswith("win"):
    WINDOWS = True
elif "darwin" in sys.platform:
    OSX = True
else:
    UNIX = True


if WINDOWS:
    HOMEDIR = os.environ["USERPROFILE"]
    PREFDIR = os.path.join(os.environ.get("APPDATA", HOMEDIR), "pigeonplanner")
elif OSX:
    HOMEDIR = os.environ["HOME"]
    PREFDIR = os.path.join(HOMEDIR, "Library", "Application Support", "pigeonplanner")
else:
    HOMEDIR = os.environ["HOME"]
    PREFDIR = os.path.join(HOMEDIR, ".pigeonplanner")
# Make sure these directories are unicode
if not isinstance(HOMEDIR, unicode):
    HOMEDIR = unicode(HOMEDIR, sys.getfilesystemencoding())
if not isinstance(PREFDIR, unicode):
    PREFDIR = unicode(PREFDIR, sys.getfilesystemencoding())

if hasattr(sys, "frozen"):
    # Most likely a py2exe package on Windows
    ROOTDIR = os.path.abspath(os.path.dirname(
        unicode(sys.executable, sys.getfilesystemencoding())))
    LANGDIR = os.path.abspath("languages")
else:
    # This file is in pigeonplanner.core, so go 2 directories up
    ROOTDIR = os.path.abspath(os.path.join(os.path.dirname(
        unicode(__file__, sys.getfilesystemencoding())), os.pardir, os.pardir))
    if ROOTDIR.endswith(".egg"):
        #TODO: Used in Mac OS X package. Can be improved?
        ROOTDIR = os.path.join(ROOTDIR, u"share", u"pigeonplanner")
    LANGDIR = os.path.join(ROOTDIR, u"languages")

IMAGEDIR = os.path.join(ROOTDIR, u"images")
GLADEDIR = os.path.join(ROOTDIR, u"glade")
RESULTPARSERDIR = os.path.join(ROOTDIR, u"resultparsers")

THUMBDIR = os.path.join(PREFDIR, u"thumbs")
PLUGINDIR = os.path.join(PREFDIR, u"plugins")
DATABASE = os.path.join(PREFDIR, u"pigeonplanner.db")
LOGFILE = os.path.join(PREFDIR, u"pigeonplanner.log")
CONFIGFILE_OLD = os.path.join(PREFDIR, u"pigeonplanner.cfg")
CONFIGFILE = os.path.join(PREFDIR, u"pigeonplanner.json")

TEMPDIR = tempfile.gettempdir()

UPDATEURL = "http://www.pigeonplanner.com/version.json"
DOWNLOADURL = "http://www.pigeonplanner.com/download"
FORUMURL = "http://forum.pigeonplanner.com"
MAILURL = "http://www.pigeonplanner.com/cgi-bin/pigeonplanner_mailing.py"
REPORTMAIL = "timovwb@gmail.com"
DOCURL = WEBSITE + "/index.php?option=com_content&view=article&catid=9&id=%s"
DOCURLMAIN = WEBSITE + "/support/documentation"

DOMAIN = "pigeonplanner"

USER_AGENT = {"User-Agent": "Pigeon Planner/%s" % VERSION}

LOG_FORMAT = "[%(asctime)s] %(name)s %(levelname)s: %(message)s"
LOG_FORMAT_CLI = "%(name)s %(levelname)s: %(message)s"
DATE_FORMAT = "%Y-%m-%d"

LOGO_IMG = os.path.join(IMAGEDIR, "icon_logo.png")

