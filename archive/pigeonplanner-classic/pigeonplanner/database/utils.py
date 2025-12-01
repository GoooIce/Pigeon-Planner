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


OR = " OR "
AND = " AND "

def build_sql_insert_cols(data):
    cols = []
    values = []
    for key in data.keys():
        cols.append(key)
        values.append(":%s" % key)
    cols = ", ".join(cols)
    values = ", ".join(values)
    return {"columns": cols, "values": values}

def build_sql_cols(data, delimiter=", "):
    cols = []
    for key in data.keys():
        cols.append("%s=:%s" % (key, key))
    return delimiter.join(cols)

