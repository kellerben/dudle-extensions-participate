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

Poll.rmRow = function (name) {
	if ($("#" + gfHtmlID(escapeHtml(name)) + "_tr").length === 0) {
		throw "There is no User named: " + name + "!";
	}

	$("#" + gfHtmlID(escapeHtml(name)) + "_tr").remove();
	Poll.updateSum();
};


Poll.oldParticipantRow = [];
Poll.exchangeAddParticipantRow = function (newInnerTR) {
	if (typeof(newInnerTR) === 'undefined') {
		$("#add_participant").replaceWith(Poll.oldParticipantRow.pop().clone());
	} else {
		Poll.oldParticipantRow.push($("#add_participant"));
		$("#add_participant").replaceWith($("<tr />", {"id" : 'add_participant'}).append(newInnerTR));
	}
};

Poll.getColumns = function (user) {
	var ret = {};
	$.each(Poll.columns, function (i, col) {
		ret[col] = $("#" + gfHtmlID(escapeHtml(user)) + "_tr td[title='" + unescapeHtml(Poll.participantRowTitle(user, col)) + "']").attr("class");
	});
	return ret;
};

/*
 * May be used to add a hook just before the participants input
 * is given to the send function.
 * Poll.prepareParticipantInput(function (participantInput, submitfunc) {
 *   // do something with participantInput
 *   submitfunc();
 * });
 *
 * May include additional code which is executed before the user pressed
 * the save button.
 * Poll.prepareParticipantInput(somefunc, {
 *   before: function () {
 *     $("#savebutton").value(_("Next"));
 *   }
 * ));
 */
Poll.additionalParticipantInputFuncts = [];
Poll.prepareParticipantInput = function (func) {
	var options = arguments[1] || {};
	Poll.additionalParticipantInputFuncts.push([func, options]);
	if (Poll.additionalParticipantInputFuncts.length === 1 && options.before) {
		options.before();
	}
};


Poll.getParticipantInput = function (submitfunc) {
	var curPrepFunc, prepareParticipantInputRec, userarray = {},
		arr = $("#polltable form").serializeArray();
	if (arr[0].value !== "") {
		userarray.oldname = arr[0].value;
	}
	userarray.name = arr[1].value;
	$.each(arr, function (i, e) {
		var col = e.name.match(/^add_participant_checked_(.*)$/);
		if (col) {
			userarray[col[1]] = e.value;
		}
	});

	curPrepFunc = 0;
	prepareParticipantInputRec = function () {
		if (curPrepFunc === Poll.additionalParticipantInputFuncts.length) {
			if (submitfunc(userarray)) {
				$("#polltable form").submit();
			}
		} else {
			curPrepFunc++;
			Poll.additionalParticipantInputFuncts[curPrepFunc - 1][0](userarray, prepareParticipantInputRec);
			if (curPrepFunc !== Poll.additionalParticipantInputFuncts.length && Poll.additionalParticipantInputFuncts[curPrepFunc][1].before) {
				Poll.additionalParticipantInputFuncts[curPrepFunc][1].before();
			}
		}
	};
	prepareParticipantInputRec();
};

/*
 * interrupt send process and bind some function beforewards
 * submitfunc has to return true/false wether the original submit should
 * be done
 */
Poll.submitHook = function (submitfunc) {
	Poll.submitIsBound = true;
	$("#polltable form").bind("submit", function (e) {
		e.preventDefault();
		Poll.getParticipantInput(submitfunc);
	});
};
Poll.submitIsBound = false;


Poll.addSeparartors = function () {
	$("#add_participant").before($("#separator_top").remove());
	$("#add_participant").after($("#separator_bottom").remove());
};

Poll.cancelEdit = function () {
	$("#add_participant").replaceWith(Poll.currentEditUser);
	delete Poll.currentEditUser;
	$("#summary").before(Poll.oldParticipantRow.pop().clone());
	Poll.addSeparartors();
};

Poll.cancelPossibleEdit = function () {
	if (Poll.currentEditUser) {
		Poll.cancelEdit();
	}
	Poll.oldParticipantRow.push($("#add_participant"));
};

/**
 * exchanges the Users row with the participate-row
 * stores old userrow in Poll.currentEditUser
 */
Poll.editUser = function (user) {
	Poll.cancelPossibleEdit();

	$("#add_participant").remove();
	var usercols = Poll.getColumns(user);
	Poll.currentEditUser = $("#" + gfHtmlID(escapeHtml(user)) + "_tr");
	$("#" + gfHtmlID(escapeHtml(user)) + "_tr").replaceWith($(Poll.oldParticipantRow).last()[0].clone());
	$.each(usercols, function (col, htmlclass) {
		$("#add_participant_checked_" + gfHtmlID(col) + "_" + htmlclass).click();
	});
	$("#add_participant_input").val(user);
	$("#add_participant_input_td input[name='olduser']").val(user);
	$("#savebutton").after("<br /><input type='button' value='" + _("Cancel") + "' onclick='Poll.cancelEdit()'/>");

	Poll.addSeparartors();
};

Poll.addParticipantTR = function (id, tdInnerHtml) {
	var tr = $('<tr />', {
		'class' : 'participantrow',
		'id'    : id
	});
	tr.append($("<td />", {
		'colspan' : (Poll.columns.length + 3),
	}).append(tdInnerHtml));
	$("#separator_top").before(tr);
	return $("#" + id);
};

Poll.hint = function (message, divClass) {
	var id = "error_" + Math.round(Math.random() * 10000);
	divClass = divClass || "hint";
	Poll.addParticipantTR(id, $("<div/>",{ "class":divClass}).text(message));
	window.setTimeout(function () {
		$("#" + id + " div").animate({
				opacity: 0,
				height: 'toggle'
			}, 500, function () {
				$("#" + id).remove();
			});
	}, 7000);
};

Poll.resetForm = function () {
	$("#polltable form")[0].reset();
};


$(document).ready(function () {
	$(".sortsymb").remove();
	$.each($("#participanttable th a"), function (i, col) {
		$(col).click(function () {
			Poll.sort(i);
			return false;
		});
	});
	$("#participanttable th a").addClass("header");
	Poll.sort(Poll.columns.length + 1);

});
