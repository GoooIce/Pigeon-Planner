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


import os
import logging
logger = logging.getLogger(__name__)

from . import enums
from . import errors
from pigeonplanner import database
from pigeonplanner import thumbnail
from pigeonplanner.core import common
from pigeonplanner.core import pigeonparser


def add_pigeon(data, status, statusdata):
    """
    Add a pigeon

    @param data:
    @param status: One of the status constants
    @param statusdata:
    """

    if not data["sex"] in (enums.Sex.cock, enums.Sex.hen, enums.Sex.unknown):
        raise ValueError("Sex value has to be of type enums.Sex, but got '%r'" % data["sex"])

    try:
        database.add_pigeon(data)
    except database.InvalidValueError:
        pindex = data["pindex"]
        if pigeonparser.parser.pigeons[pindex].show == 1:
            logger.debug("Pigeon already exists '%s'", pindex)
            raise errors.PigeonAlreadyExists(pindex)
        else:
            raise errors.PigeonAlreadyExistsHidden(pindex)

    if status != enums.Status.active:
        database.add_status(common.get_status_table(status), statusdata)

    # Save the data values
    database.add_data(database.Tables.COLOURS, data.get("colour", ""))
    database.add_data(database.Tables.STRAINS, data.get("strain", ""))
    database.add_data(database.Tables.LOFTS, data.get("loft", ""))

    return pigeonparser.parser.add_pigeon(pindex=data["pindex"])

def update_pigeon(pigeon, data, status, statusdata):
    """
    Update the pigeon

    @param pigeon: 
    @param data:
    @param status: One of the status constants
    @param statusdata:
    """

    if not data["sex"] in (enums.Sex.cock, enums.Sex.hen, enums.Sex.unknown):
        raise ValueError("Sex value has to be of type enums.Sex, but got '%r'" % data["sex"])

    try:
        database.update_pigeon(pigeon.pindex, data)
    except database.InvalidValueError:
        if pigeon.show == 1:
            logger.debug("Pigeon already exists '%s'", pigeon.pindex)
            raise errors.PigeonAlreadyExists(pigeon.pindex)
        else:
            raise errors.PigeonAlreadyExistsHidden(pigeon.pindex)

    database.update_result_for_pindex(pigeon.pindex, {"pindex": data["pindex"]})
    database.update_medication_for_pindex(pigeon.pindex, {"pindex": data["pindex"]})
    database.update_media_for_pindex(pigeon.pindex, {"pindex": data["pindex"]})
    # Remove the old thumbnail (if exists)
    if pigeon.get_image() and data["image"] != pigeon.get_image():
        try:
            os.remove(thumbnail.get_path(pigeon.get_image()))
        except:
            pass

    old_status = pigeon.get_active()
    if status != old_status:
        # Status has changed. Remove the old status and add the new data.
        if old_status != enums.Status.active:
            database.remove_status(common.get_status_table(old_status), pigeon.pindex)
        if status != enums.Status.active:
            database.add_status(common.get_status_table(status), statusdata)
    else:
        # Status stayed the same, just update those values
        if status != enums.Status.active:
            database.update_status(common.get_status_table(status), pigeon.pindex, statusdata)

    # Save the data values
    database.add_data(database.Tables.COLOURS, data.get("colour", ""))
    database.add_data(database.Tables.STRAINS, data.get("strain", ""))
    database.add_data(database.Tables.LOFTS, data.get("loft", ""))

    return pigeonparser.parser.update_pigeon(data["pindex"], pigeon.pindex)

def remove_pigeon(pigeon, remove_results=True):
    pindex = pigeon.get_pindex()
    logger.debug("Start removing pigeon '%s'", pindex)

    status = pigeon.get_active()
    if status != enums.Status.active:
        database.remove_status(common.get_status_table(status), pindex)

    try:
        os.remove(thumbnail.get_path(pigeon.get_image()))
    except:
        pass

    database.remove_medication({"pindex": pindex})
    database.remove_media({"pindex": pindex})
    database.remove_pigeon(pindex)
    pigeonparser.parser.remove_pigeon(pindex)

    if remove_results:
        database.remove_result_for_pigeon(pindex)

def build_pedigree_tree(pigeon, index, depth, lst):
    if depth > 5 or pigeon is None or index >= len(lst):
        return

    lst[index] = pigeon
    pindex = pigeon.get_pindex()
    if pindex in pigeonparser.parser.get_pigeons():
        sire , dam = pigeonparser.parser.get_parents(pigeon)
        build_pedigree_tree(sire, (2*index)+1, depth+1, lst)
        build_pedigree_tree(dam, (2*index)+2, depth+1, lst)

