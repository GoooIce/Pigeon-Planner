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
from yapsy.PluginManager import PluginManager

from . import utils
from pigeonplanner.core import const
from pigeonplanner.core import enums
from pigeonplanner.core import pigeonparser

manager = PluginManager()
manager.setPluginPlaces([const.RESULTPARSERDIR])
manager.collectPlugins()

def test_dtd():
    pigeonparser.parser.build_pigeons()
    pigeonparser.parser.add_empty_pigeon("12345672013", enums.Sex.cock)
    pigeonparser.parser.add_empty_pigeon("12345682013", enums.Sex.cock)
    pigeons = pigeonparser.parser.pigeons.keys()

    parser = manager.getPluginByName("Data Technology-Deerlijk").plugin_object

    filedata = {"sector": "HET LOKAAL", "category": "JONGE",
                "racepoint": "FONTENAY SUR EURE", "date": "2013-05-25", "n_pigeons": "247"}
    fileresults = {"12345672013": ["1234567", "2013", 1, "1397,00"],
                   "12345682013": ["1234568", "2013", 3, "1369,40"]}
    # 2 word sector, 3 word racepoint
    with open("tests/data/result_dtd_1.txt") as resultfile:
        data, results = parser.parse_file(resultfile, pigeons)
    nt.assert_dict_equal(data, filedata)
    nt.assert_dict_equal(results, fileresults)
    # Same as previous test, prepended empty lines and seperator dashes
    with open("tests/data/result_dtd_2.txt") as resultfile:
        data, results = parser.parse_file(resultfile, pigeons)
    nt.assert_dict_equal(data, filedata)
    # Same as previous tests, 1 word racepoint
    filedata["racepoint"] = "CHIMAY"
    with open("tests/data/result_dtd_3.txt") as resultfile:
        data, results = parser.parse_file(resultfile, pigeons)
    nt.assert_dict_equal(data, filedata)
    # Bogus header, needs to fail
    with open("tests/data/result_dtd_4.txt") as resultfile:
        nt.assert_raises(ValueError, parser.parse_file, resultfile, pigeons)
    # 2 word category
    filedata["category"] = "JONGE R3"
    with open("tests/data/result_dtd_5.txt") as resultfile:
        data, results = parser.parse_file(resultfile, pigeons)
    nt.assert_dict_equal(data, filedata)
    # Extra column at the end
    filedata["category"] = "JONGEN"
    filedata["n_pigeons"] = "66"
    filedata["racepoint"] = "LA SOUTERRAINE"
    with open("tests/data/result_dtd_6.txt") as resultfile:
        data, results = parser.parse_file(resultfile, pigeons)
    nt.assert_dict_equal(data, filedata)

test_dtd.setup = utils.open_test_db
test_dtd.teardown = utils.close_test_db
