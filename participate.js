/****************************************************************************
 * Copyright 2009,2010,2011 Benjamin Kellermann                             *
 *                                                                          *
 * This file is part of dudle.                                              *
 *                                                                          *
 * Dudle is free software: you can redistribute it and/or modify it under   *
 * the terms of the GNU Affero General Public License as published by       *
 * the Free Software Foundation, either version 3 of the License, or        *
 * (at your option) any later version.                                      *
 *                                                                          *
 * Dudle is distributed in the hope that it will be useful, but WITHOUT ANY *
 * WARRANTY; without even the implied warranty of MERCHANTABILITY or        *
 * FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public     *
 * License for more details.                                                *
 *                                                                          *
 * You should have received a copy of the GNU Affero General Public License *
 * along with dudle.  If not, see <http://www.gnu.org/licenses/>.           *
 ***************************************************************************/

"use strict";

Poll.participantRowTitle = function (username, column) {
	return username + ": " + column;
};

Poll.rmRow = function (name) {
	if ($("#" + gfHtmlID(escapeHtml(name)) + "_tr").length === 0) {
		throw "There is no User named: " + name + "!";
	}
	var colsSum = {};
	$.each(Poll.getColumns(name), function (col, htmlclass) {
		colsSum[col] = htmlclass.match(/yes/) ? -1 : 0; 
	});

	Poll.modifySum(colsSum);
	$("#" + gfHtmlID(escapeHtml(name)) + "_tr").remove();
};

Poll.addRow = function (name, columns) {
	var tr = "<tr class='participantrow' id='" + gfHtmlID(name) + "_tr'><td>";
	tr += columns.firstTD || "";
	tr += "</td>";
	tr += "<td class='name'>";
	tr += columns.name || "";
	tr += "</td>";

	$.each(Poll.columns, function (i) {
		tr += columns[Poll.columns[i]];
	});
	tr += "</tr>";
	$("#separator_top").before(tr);
};

Poll.modifySum = function (columns) {
	$.each(Poll.columns, function (i) {
		var col = Poll.columns[i],
			colElem = $("#" + gfHtmlID("sum_" + col)),
			newSum = parseInt(colElem.text(), 10) + columns[col],
			percentage = newSum * 100 / $(".participantrow").size();

		colElem.text(newSum);
		

		colElem.attr({
			title: Math.round(percentage).toString() + " %",
			class: "sum match_" + (Math.round(percentage / 10) * 10).toString()
		});
	});
};

Poll.parseNaddRow = function (name, columns) {
	var colsHtml = {name: columns.name}, colsSum = {};

	if (columns.editUser && columns.deleteUser) {
		colsHtml.firstTD = "<span class='edituser'>";
		colsHtml.firstTD += "<a href='javascript:" + columns.editUser + "(\"" + name + "\")' title='" + printf(_("Edit User %1 ..."), [name]) + "'>";
		colsHtml.firstTD += Poll.Strings.Edit + "</a>";
		colsHtml.firstTD += " | ";
		colsHtml.firstTD += "<a href='javascript:" + columns.deleteUser + "(\"" + name + "\")' title='" + printf(_("Delete User %1 ..."), [name]) + "'>";
		colsHtml.firstTD += Poll.Strings.Delete + "</a></span>";
	}

	$.each(Poll.columns, function (i) {
		var col = Poll.columns[i],
		 avail = columns[col],
		 tdClass, tdText;
		if (Poll.Strings[avail]) {
			tdClass = Poll.Strings[Poll.Strings[avail]].val;
			tdText = Poll.Strings[Poll.Strings[avail]].symb;
		} else {
			tdClass = 'undecided';
			tdText = Poll.Strings.Unknown;
		}

		colsHtml[col] = "<td class='" + tdClass + "' title='" + Poll.participantRowTitle(name, col) + "'>" + tdText + "</td>";
		colsSum[col] = avail === Poll.Strings.yes.val ? 1 : 0;
	});
	Poll.addRow(name, colsHtml);
	Poll.modifySum(colsSum);
};

Poll.oldParticipantRow = [];
Poll.exchangeAddParticipantRow = function (newInnerTR) {
	if (typeof(newInnerTR) === 'undefined') {
		$("#add_participant").replaceWith(Poll.oldParticipantRow[0].clone());
		Poll.oldParticipantRow = [];
	} else {
		Poll.oldParticipantRow.push($("#add_participant"));
		$("#add_participant").replaceWith("<tr id='add_participant'>" + newInnerTR + "</tr>");
	}
};

Poll.getColumns = function (user) {
	var ret = {};
	$.each(Poll.columns, function (i) {
		var col = Poll.columns[i];
		ret[col] = $("#" + gfHtmlID(escapeHtml(user)) + "_tr td[title='" + unescapeHtml(Poll.participantRowTitle(user, col)) + "']")[0].classList[0];
	});
	return ret;
};

Poll.addSeparartors = function () {
	$("#add_participant").before($("#separator_top").remove());
	$("#add_participant").after($("#separator_bottom").remove());
};

Poll.cancelEdit = function () {
	$("#add_participant").replaceWith(Poll.currentEditUser);
	Poll.currentEditUser = "";
	$("#summary").before(Poll.oldParticipantRow[0].clone());
	Poll.oldParticipantRow = [];
	Poll.addSeparartors();
};

Poll.currentEditUser = "";
Poll.editUser = function (user) {
	if (Poll.currentEditUser !== "") {
		Poll.cancelEdit();
	}

	Poll.oldParticipantRow.push($("#add_participant"));

	$("#add_participant").remove();
	var usercols = Poll.getColumns(user);
	Poll.currentEditUser = $("#" + gfHtmlID(escapeHtml(user)) + "_tr");
	$("#" + gfHtmlID(escapeHtml(user)) + "_tr").replaceWith(Poll.oldParticipantRow[0].clone());
	$.each(usercols, function (col, htmlclass) {
		$("#add_participant_checked_" + gfHtmlID(col) + "_" + htmlclass).click();
	});
	$("#add_participant_input")[0].value = user;
	$("#add_participant_input_td input[name='olduser']")[0].value = user;
	$("#savebutton").after("<br /><input type='button' value='" + _("Cancel") + "' onclick='Poll.cancelEdit()'/>");

	Poll.addSeparartors();
};

Poll.error = function (message) {
	var rand = Math.round(Math.random() * 10000), tr;
	tr = "<tr id='error_" + rand + "'><td colspan='" + (Poll.columns.length + 3) + "'>";
	tr += "<div class='hint'>" + escapeHtml(message) + "</div>";
	tr += "</td></tr>";
	$("#separator_top").before(tr);
	window.setTimeout(function () {
		$("#error_" + rand + " div").animate({
				opacity: 0,
				height: 'toggle'
			}, 500, function () {
				$("#error_" + rand).remove();
			});
	}, 7000);
};


//$.ajax({
//  url: Poll.extDir + "/webservices.cgi",
//  data: {service: 'getColumns', pollID: Poll.ID},
//  method:"get",
//  success:function (response){
//    Poll.columns = JSON.parse(response);
//  }
//});

//window.setTimeout(test, 3);

function test() {	// test
	var username = "peter";
	Poll.addRow(username, {
		firstTD: "<span class='edituser'><a href='#editUser' username='" + username + "' title='" + printf(_("Edit User %1 ..."), [username]) + "'>" + Poll.Strings.Edit + "</a> | <a href='#deleteUser' username='" + username + "title='" + printf(_("Delete User %1 ..."), [username]) + "'>" + Poll.Strings.Delete + "</a></span>",
		name: "foobarbaz",
		"2011-04-25": "<td>a</td>",
		"2011-04-26": "<td>b</td>",
		"2011-04-28": "<td>d</td>",
		"2011-04-27": "<td>c</td>"
	});

	Poll.parseNaddRow("foo2", {
		"2011-04-25": "a_yes__",
		"2011-04-26": "a_yes__",
		"2011-04-27": "c_no___",
		"2011-04-28": "b_maybe"
	});
	Poll.parseNaddRow("foo1", {
		"2011-04-25": "a_yes__",
		"2011-04-26": "a_yes__",
		"2011-04-27": "c_no___",
		"2011-04-28": "b_maybe"
	});
	Poll.parseNaddRow("foo9", {
		"2011-04-25": "a_yes__",
		"2011-04-26": "a_yes__",
		"2011-04-27": "c_no___",
		"2011-04-28": "b_maybe"
	});

}

