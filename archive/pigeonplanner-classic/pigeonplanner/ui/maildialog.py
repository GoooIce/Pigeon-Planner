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
import os.path
import threading
import logging
logger = logging.getLogger(__name__)

import gtk
import gobject

from pigeonplanner import messages
from pigeonplanner.ui import builder
from pigeonplanner.ui.messagedialog import ErrorDialog
from pigeonplanner.core import const
from pigeonplanner.core import common
from pigeonplanner.core import errors
from pigeonplanner.core import mailing


class MailDialog(builder.GtkBuilder):
    def __init__(self, parent, attachment, kind="pdf"):
        builder.GtkBuilder.__init__(self, "Dialogs.ui")

        self.widgets.maildialog.set_transient_for(parent)

        self.widgets.send.set_use_stock(True)
        self.attachment = attachment
        self.kind = kind
        self.sending = False

        self.widgets.textbuffer = gtk.TextBuffer()
        self.widgets.textview_message.set_buffer(self.widgets.textbuffer)

        if kind == "pdf":
            self.widgets.frame_to.show()
            self.widgets.frame_subject.show()
        else:
            import uuid
            self.widgets.entry_subject.set_text("Pigeon Planner %s errorlog [%s]"
                                                % (const.VERSION, str(uuid.uuid1())))
            self.widgets.entry_to.set_text(const.REPORTMAIL)
            self.widgets.rename.hide()

        name, email = "", ""
        info = common.get_own_address()
        if info:
            name = info["name"]
            email = info["email"]

        self.widgets.entry_name.set_text(name)
        self.widgets.entry_mail.set_text(email)
        self.widgets.label_attachment.set_text(os.path.basename(attachment))

        if kind == "log":
            self.widgets.entry_name.grab_focus()
            self.widgets.entry_name.set_position(-1)
        self.widgets.maildialog.show()

    def close_dialog(self, widget=None, event=None):
        if not self.sending:
            if self.kind == "pdf":
                try:
                    os.remove(self.attachment)
                except:
                    pass

            self.widgets.maildialog.destroy()

    def on_cancel_clicked(self, widget):
        self.close_dialog()

    def on_close_clicked(self, widget):
        self.close_dialog()

    def on_rename_clicked(self, widget):
        self.widgets.entry_attachment.set_text(os.path.basename(self.attachment))

        self.widgets.hbox_label.hide()
        self.widgets.hbox_entry.show()

    def on_apply_clicked(self, widget):
        filename = self.widgets.entry_attachment.get_text()
        if not filename.endswith(".pdf"):
            filename += ".pdf"

        new_attachment = os.path.join(const.TEMPDIR, filename)

        os.rename(self.attachment, new_attachment)

        self.attachment = new_attachment
        self.widgets.label_attachment.set_text(filename)

        self.widgets.hbox_entry.hide()
        self.widgets.hbox_label.show()

    def on_send_clicked(self, widget):
        if (not self.widgets.entry_to.get_text() or not 
                self.widgets.entry_mail.get_text()):
            ErrorDialog(messages.MSG_NEED_EMAIL, self.widgets.maildialog)
            return

        self.widgets.progressbar.show()
        self.widgets.vbox_fields.set_sensitive(False)
        self.widgets.action_area.set_sensitive(False)
        th = threading.Thread(None, self.sendmail_thread, None)
        th.start()

    def sendmail_thread(self):
        self.sending = True
        gobject.timeout_add(100, self.pulse_progressbar)

        recipient = self.widgets.entry_to.get_text()
        subject = self.widgets.entry_subject.get_text()
        body = self.widgets.textbuffer.get_text(
                                *self.widgets.textbuffer.get_bounds()).strip()
        sender = "%s <%s>" % (self.widgets.entry_name.get_text(),
                              self.widgets.entry_mail.get_text())

        try:
            mailing.send_email(recipient, sender, subject, body, self.attachment)
            error = False
        except (errors.UrlTimeout, Exception) as exc:
            error = True
            logger.error(exc)

        self.sending = False
        gobject.idle_add(self.send_finished, error)

    def send_finished(self, error):
        self.widgets.progressbar.hide()
        self.widgets.send.hide()
        self.widgets.cancel.hide()
        self.widgets.close.show()
        self.widgets.action_area.set_sensitive(True)
        msg = _("The e-mail has been sent succesfully!") if not error else \
                    _("Connection to server failed!")
        self.widgets.label_result.set_markup("<b>%s</b>" % msg)
        self.widgets.label_result.show()

    def pulse_progressbar(self):
        if self.sending:
            self.widgets.progressbar.pulse()
            return True

