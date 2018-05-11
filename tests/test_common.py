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

from pigeonplanner.core import common


def test_func_name():
    value = common.get_function_name()
    nt.assert_equal(value, "test_func_name")

def test_pindex_conersions():
    value = common.get_pindex_from_band("BE-1234567", "2014")
    nt.assert_equal(value, "BE-12345672014")
    value = common.get_pindex_from_band("87-CUST-2222", "2014")
    nt.assert_equal(value, "87-CUST-22222014")

    value = common.get_pindex_from_band_string("BE-1234567/2014")
    nt.assert_equal(value, "BE-12345672014")
    value = common.get_pindex_from_band_string("BE-1234567 / 2014")
    nt.assert_equal(value, "BE-12345672014")

    value = common.get_band_from_pindex("BE-12345672014")
    nt.assert_tuple_equal(value, ("BE-1234567", "2014"))
    value = common.get_band_from_pindex("87-CUST-22222014")
    nt.assert_tuple_equal(value, ("87-CUST-2222", "2014"))

def test_coefficient():
    value = common.calculate_coefficient(1, 100)
    nt.assert_equal(value, 1.0)

    value = common.calculate_coefficient(1, 370)
    nt.assert_almost_equal(value, 0.2703, 4)
    value = common.calculate_coefficient(1, 370, True)
    nt.assert_equal(value, "0,2703")

    value = common.calculate_coefficient(3, 981)
    nt.assert_almost_equal(value, 0.3058, 4)
    value = common.calculate_coefficient(3, 981, True)
    nt.assert_equal(value, "0,3058")

    value = common.calculate_coefficient(30, 370)
    nt.assert_almost_equal(value, 8.1081, 4)
    value = common.calculate_coefficient(30, 370, True)
    nt.assert_equal(value, "8,1081")

def test_escape_text():
    value = common.escape_text(None)
    nt.assert_equal(value, "")
    value = common.escape_text("")
    nt.assert_equal(value, "")
    value = common.escape_text("No markup")
    nt.assert_equal(value, "No markup")
    value = common.escape_text("<Edit>")
    nt.assert_equal(value, "&lt;Edit&gt;")
    value = common.escape_text("Spam & eggs")
    nt.assert_equal(value, "Spam &amp; eggs")

