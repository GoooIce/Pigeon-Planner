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


from pigeonplanner.database import main
from pigeonplanner.database import utils
from pigeonplanner.database import session


##############
##  Addresses
##############
def get_all_addresses():
    session.cursor.execute("SELECT * FROM Addresses ORDER BY name ASC")
    return session.cursor.fetchall()

def get_address_data(data):
    cols = utils.build_sql_cols(data)
    session.cursor.execute("SELECT * FROM Addresses WHERE %s" % cols, data)
    return session.cursor.fetchone()

def add_address(data):
    sqldata = utils.build_sql_insert_cols(data)
    session.cursor.execute("INSERT INTO Addresses(%(columns)s) VALUES(%(values)s)" % sqldata, data)
    session.connection.commit()
    return session.cursor.lastrowid

def update_address(key, data):
    cols = utils.build_sql_cols(data)
    data["key"] = key
    session.cursor.execute("UPDATE Addresses SET %s WHERE Addresskey=:key" % cols, data)
    session.connection.commit()

def remove_address(key):
    session.cursor.execute("DELETE FROM Addresses WHERE Addresskey=?", (key,))
    session.connection.commit()

##############
##  Racepoints
##############
def get_all_racepoints():
    session.cursor.execute("SELECT * FROM Racepoints ORDER BY racepoint ASC")
    return session.cursor.fetchall()

def get_racepoint_data(racepoint):
    session.cursor.execute("SELECT * FROM Racepoints WHERE racepoint=?", (racepoint,))
    return session.cursor.fetchone()

def add_racepoint(data):
    sqldata = utils.build_sql_insert_cols(data)
    session.cursor.execute("INSERT OR IGNORE INTO Racepoints(%(columns)s) VALUES(%(values)s)" % sqldata, data)
    session.connection.commit()
    return session.cursor.lastrowid

def update_racepoint(racepoint, data):
    cols = utils.build_sql_cols(data)
    data["racepoint"] = racepoint
    session.cursor.execute("UPDATE Racepoints SET %s WHERE racepoint=:racepoint" % cols, data)
    session.connection.commit()

##############
##  Data
##############
def get_all_data(table):
    try:
        column = main.Schema.get_column_names(table)[1]
    except KeyError:
        raise ValueError("Invalid table name '%s'" % table)
    session.cursor.execute("SELECT %s FROM %s ORDER BY %s ASC" % (column, table, column))
    return [row[0] for row in session.cursor.fetchall()]

def add_data(table, item):
    if not item: return
    try:
        column = main.Schema.get_column_names(table)[1]
    except KeyError:
        raise ValueError("Invalid table name '%s'" % table)
    session.cursor.execute("INSERT OR IGNORE INTO %s(%s) VALUES(?)" % (table, column), (item,))
    session.connection.commit()

def remove_data(table, item):
    try:
        column = main.Schema.get_column_names(table)[1]
    except KeyError:
        raise ValueError("Invalid table name '%s'" % table)
    session.cursor.execute("DELETE FROM %s WHERE %s=?" % (table, column), (item,))
    session.connection.commit()

