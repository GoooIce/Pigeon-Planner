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


import nose.tools as nt
from . import utils

from pigeonplanner.core import enums
from pigeonplanner.core import errors
from pigeonplanner.core import pigeon as corepigeon
from pigeonplanner.core import pigeonparser


def test_pigeon_helpers():
    pigeonparser.parser.build_pigeons()

    # Correct, minimal data dict
    data = {"pindex": "12342014", "band": "1234", "year": "2014", "sex": enums.Sex.cock}

    # Try a minimal insert
    pigeon = corepigeon.add_pigeon(data, enums.Status.active, {})
    nt.assert_is_instance(pigeon, pigeonparser.Pigeon)

    # Insert existing pigeon
    nt.assert_raises(errors.PigeonAlreadyExists, corepigeon.add_pigeon, data, enums.Status.active, {})

    # Hide the testpigeon
    hiddendata = {"show": 0}
    hiddendata.update(data)
    pigeon = corepigeon.update_pigeon(pigeon, hiddendata, enums.Status.active, {})

    # Try to add it again
    nt.assert_raises(errors.PigeonAlreadyExistsHidden, corepigeon.add_pigeon, data, enums.Status.active, {})

    # Remove the testpigeon
    corepigeon.remove_pigeon(pigeon)

    # Sex has to be an int
    errordata = data.copy()
    errordata["sex"] = "0"
    nt.assert_raises(ValueError, corepigeon.add_pigeon, errordata, enums.Status.active, {})
test_pigeon_helpers.setup = utils.open_test_db
test_pigeon_helpers.teardown = utils.close_test_db


