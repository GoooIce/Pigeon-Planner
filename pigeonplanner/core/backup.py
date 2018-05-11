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
Provides backup and restore functions
"""

import os
import zipfile
from os.path import isdir, join, normpath, split
import logging
logger = logging.getLogger(__name__)

from pigeonplanner.core import const


def make_backup(folder):
    if not isdir(folder):
        return

    infolder = const.PREFDIR
    outfile = join(folder, "PigeonPlannerBackup.zip")

    try:
        zipper = zipfile.ZipFile(outfile, "w", zipfile.ZIP_DEFLATED)
        makezip(infolder, zipper)
        zipper.close()
    except RuntimeError:
        if os.path.exists(outfile):
            os.unlink(outfile)
        zipper = zipfile.ZipFile(outfile, "w", zipfile.ZIP_STORED)
        makezip(infolder, zipper)
        zipper.close()
    except Exception as e:
        logger.exception(e)
        return False

    return True

def makezip(path, zipper):
    path = os.path.normpath(path)

    for (dirpath, dirnames, filenames) in os.walk(path):
        for filename in filenames:
            if not filename.endswith(".lock") and not\
                   filename.endswith(".log") and not\
                   filename.endswith(".old") and not\
                   filename == "Thumbs.db":
                zipper.write(os.path.join(dirpath, filename),            
                os.path.join(dirpath[len(path):], filename)) 

def restore_backup(infile):
    if not infile.endswith("PigeonPlannerBackup.zip"):
        return

    outfol = const.PREFDIR

    try:
        zipper = zipfile.ZipFile(infile, "r")
    except zipfile.BadZipfile as e:
        logger.exception(e)
        return False

    try:
        unzip(outfol, zipper)
    except Exception as e:
        logger.exception(e)
        return False

    zipper.close()

    return True

def unzip(path, zipper):
    if not isdir(path):
        os.makedirs(path)    

    for each in zipper.namelist():
        if not each.endswith("/"): 
            root, name = split(each)
            directory = normpath(join(path, root))
            if not isdir(directory):
                os.makedirs(directory)
            outfile = open(join(directory, name), "wb")
            outfile.write(zipper.read(each))
            outfile.close()

