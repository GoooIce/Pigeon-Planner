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


import sqlite3

from pigeonplanner.database import main
from pigeonplanner.database import utils
from pigeonplanner.database import session
from pigeonplanner.database.main import InvalidValueError


##############
##  Pigeons
##############
def get_all_pigeons():
    session.cursor.execute("SELECT * FROM Pigeons")
    return session.cursor.fetchall()

def get_pigeon_data(pindex):
    session.cursor.execute("SELECT * FROM Pigeons WHERE pindex=?", (pindex,))
    return session.cursor.fetchone()

def add_pigeon(data):
    sqldata = utils.build_sql_insert_cols(data)
    try:
        session.cursor.execute("INSERT INTO Pigeons(%(columns)s) VALUES(%(values)s)" % sqldata, data)
    except sqlite3.IntegrityError as exc:
        raise InvalidValueError(exc)
    session.connection.commit()
    return session.cursor.lastrowid

def update_pigeon(pindex, data):
    cols = utils.build_sql_cols(data)
    data["pindex_old"] = pindex
    try:
        session.cursor.execute("UPDATE Pigeons SET %s WHERE pindex=:pindex_old" % cols, data)
    except sqlite3.IntegrityError as exc:
        raise InvalidValueError(exc)
    session.connection.commit()

def remove_pigeon(pindex):
    session.cursor.execute("DELETE FROM Pigeons WHERE pindex=?", (pindex,))
    session.connection.commit()

def pigeon_exists(pindex):
    session.cursor.execute("SELECT EXISTS(SELECT 1 FROM Pigeons WHERE pindex=? LIMIT 1)", (pindex,))
    return bool(session.cursor.fetchone()[0])

def pigeon_is_a_parent(band, year):
    data = {"band": band, "year": year}
    session.cursor.execute("SELECT EXISTS(SELECT 1 FROM Pigeons WHERE (sire=:band AND yearsire=:year) OR (dam=:band AND yeardam=:year) LIMIT 1)", data)
    return bool(session.cursor.fetchone()[0])

def count_pigeons_with_status(status):
    session.cursor.execute("SELECT COUNT(*) FROM Pigeons WHERE show=1 AND active=?", (status,))
    return session.cursor.fetchone()[0]

def get_all_images():
    session.cursor.execute("SELECT pindex, band, year, image FROM Pigeons")
    return session.cursor.fetchall()

##############
##  Status
##############
def get_status(table, pindex):
    try:
        columns = ", ".join(main.Schema.get_column_names(table))
    except KeyError:
        raise ValueError("Invalid table name '%s'" % table)
    session.cursor.execute("SELECT %s FROM %s WHERE pindex=?" % (columns, table), (pindex,))
    return session.cursor.fetchone()

def add_status(table, data):
    if not table in main.Schema.get_table_names():
        raise ValueError("Invalid table name '%s'" % table)
    sqldata = utils.build_sql_insert_cols(data)
    sqldata["table"] = table
    session.cursor.execute("INSERT INTO %(table)s(%(columns)s) VALUES(%(values)s)" % sqldata, data)
    session.connection.commit()
    return session.cursor.lastrowid

def update_status(table, pindex, data):
    cols = utils.build_sql_cols(data)
    data["pindex_old"] = pindex
    session.cursor.execute("UPDATE %s SET %s WHERE pindex=:pindex_old" % (table, cols), data)
    session.connection.commit()

def remove_status(table, pindex):
    if not table in main.Schema.get_table_names():
        raise ValueError("Invalid table name '%s'" % table)
    session.cursor.execute("DELETE FROM %s WHERE pindex=?" % table, (pindex,))
    session.connection.commit()

##############
##  Results
##############
def result_exists(data):
    cols = utils.build_sql_cols(data, delimiter=utils.AND)
    session.cursor.execute("SELECT EXISTS(SELECT 1 FROM Results WHERE %s LIMIT 1)" % cols, data)
    return bool(session.cursor.fetchone()[0])

def pigeon_has_results(pindex):
    session.cursor.execute("SELECT EXISTS(SELECT 1 FROM Results WHERE pindex=? LIMIT 1)", (pindex,))
    return bool(session.cursor.fetchone()[0])

def get_all_results():
    session.cursor.execute("SELECT * FROM Results")
    return session.cursor.fetchall()

def get_all_races():
    session.cursor.execute("SELECT * FROM Results GROUP BY date, point ORDER BY date ASC")
    return session.cursor.fetchall()

def get_races_for_pigeon(pindex):
    session.cursor.execute("SELECT * FROM Results WHERE pindex=? GROUP BY date, point ORDER BY date ASC", (pindex,))
    return session.cursor.fetchall()

def get_race_info(date, racepoint):
    session.cursor.execute("SELECT * FROM Results WHERE date=? AND point=? LIMIT 1", (date, racepoint))
    return session.cursor.fetchone()

def get_results_for_data(data):
    cols = utils.build_sql_cols(data, delimiter=utils.AND)
    session.cursor.execute("SELECT * FROM Results WHERE %s ORDER BY place ASC" % cols, data)
    return session.cursor.fetchall()

def add_result(data):
    sqldata = utils.build_sql_insert_cols(data)
    session.cursor.execute("INSERT INTO Results(%(columns)s) VALUES(%(values)s)" % sqldata, data)
    session.connection.commit()
    return session.cursor.lastrowid

def update_result_for_pindex(pindex, data):
    cols = utils.build_sql_cols(data)
    data["pindex_old"] = pindex
    session.cursor.execute("UPDATE Results SET %s WHERE pindex=:pindex_old" % cols, data)
    session.connection.commit()

def update_result_for_key(key, data):
    cols = utils.build_sql_cols(data)
    data["key"] = key
    session.cursor.execute("UPDATE Results SET %s WHERE Resultkey=:key" % cols, data)
    session.connection.commit()

def update_result_as_race(date, racepoint, type_, wind, windspeed, weather, temperature):
    session.cursor.execute("UPDATE Results SET type=?, wind=?, windspeed=?, weather=?, temperature=? WHERE date=? AND point=?", (type_, wind, windspeed, weather, temperature, date, racepoint))
    session.connection.commit()

def remove_result(key):
    session.cursor.execute("DELETE FROM Results WHERE Resultkey=?", (key,))
    session.connection.commit()

def remove_result_for_pigeon(pindex):
    session.cursor.execute("DELETE FROM Results WHERE pindex=?", (pindex,))
    session.connection.commit()

def count_results():
    session.cursor.execute("SELECT COUNT(*) FROM Results")
    return session.cursor.fetchone()[0]

##############
##  Medication
##############
def pigeon_has_medication(pindex):
    session.cursor.execute("SELECT EXISTS(SELECT 1 FROM Medication WHERE pindex=? LIMIT 1)", (pindex,))
    return bool(session.cursor.fetchone()[0])

def get_pigeons_for_medid(medid):
    session.cursor.execute("SELECT pindex FROM Medication WHERE medid=?", (medid,))
    return [row[0] for row in session.cursor.fetchall() if row[0]]

def get_medication_for_pigeon(pindex):
    session.cursor.execute("SELECT * FROM Medication WHERE pindex=?", (pindex,))
    return session.cursor.fetchall()

def get_medication_for_id(ID):
    session.cursor.execute("SELECT * FROM Medication WHERE medid=?", (ID,))
    return session.cursor.fetchone()

def add_medication(data):
    sqldata = utils.build_sql_insert_cols(data)
    session.cursor.execute("INSERT INTO Medication(%(columns)s) VALUES(%(values)s)" % sqldata, data)
    session.connection.commit()
    return session.cursor.lastrowid

def update_medication(medid, data):
    cols = utils.build_sql_cols(data)
    data["medid"] = medid
    session.cursor.execute("UPDATE Medication SET %s WHERE medid=:medid" % cols, data)
    session.connection.commit()

def update_medication_for_pindex(pindex, data):
    cols = utils.build_sql_cols(data)
    data["pindex_old"] = pindex
    session.cursor.execute("UPDATE Medication SET %s WHERE pindex=:pindex_old" % cols, data)
    session.connection.commit()

def remove_medication(data):
    cols = utils.build_sql_cols(data, delimiter=utils.AND)
    session.cursor.execute("DELETE FROM Medication WHERE %s" % cols, data)
    session.connection.commit()

def count_medication_records_for_medid(medid):
    session.cursor.execute("SELECT COUNT(*) FROM Medication WHERE medid=?", (medid,))
    return session.cursor.fetchone()[0]

##############
##  Breeding
##############
def get_breeding_for_pigeon(pindex, cock):
    pigeon, mate = ("sire", "dam") if cock else ("dam", "sire")
    sql = "SELECT Breedingkey, %s, date FROM Breeding WHERE %s=? ORDER BY %s, date" % (mate, pigeon, mate)
    session.cursor.execute(sql, (pindex,))
    return session.cursor.fetchall()

def get_breeding_for_key(key):
    session.cursor.execute("SELECT * FROM Breeding WHERE Breedingkey=?", (key,))
    return session.cursor.fetchone()

def add_breeding(data):
    sqldata = utils.build_sql_insert_cols(data)
    session.cursor.execute("INSERT INTO Breeding(%(columns)s) VALUES(%(values)s)" % sqldata, data)
    session.connection.commit()
    return session.cursor.lastrowid

def update_breeding(key, data):
    cols = utils.build_sql_cols(data)
    data["key"] = key
    session.cursor.execute("UPDATE Breeding SET %s WHERE Breedingkey=:key" % cols, data)
    session.connection.commit()

def remove_breeding(key):
    session.cursor.execute("DELETE FROM Breeding WHERE Breedingkey=?", (key,))
    session.connection.commit()

def count_breeding_records():
    session.cursor.execute("SELECT COUNT(*) FROM Breeding")
    return session.cursor.fetchone()[0]

##############
##  Media
##############
def get_media_for_pigeon(pindex):
    session.cursor.execute("SELECT * FROM Media WHERE pindex=?", (pindex,))
    return session.cursor.fetchall()

def add_media(data):
    sqldata = utils.build_sql_insert_cols(data)
    session.cursor.execute("INSERT INTO Media(%(columns)s) VALUES(%(values)s)" % sqldata, data)
    session.connection.commit()
    return session.cursor.lastrowid

def update_media_for_pindex(pindex, data):
    cols = utils.build_sql_cols(data)
    data["pindex_old"] = pindex
    session.cursor.execute("UPDATE Media SET %s WHERE pindex=:pindex_old" % cols, data)
    session.connection.commit()

def remove_media(data):
    cols = utils.build_sql_cols(data, delimiter=utils.AND)
    session.cursor.execute("DELETE FROM Media WHERE %s" %cols, data)
    session.connection.commit()

