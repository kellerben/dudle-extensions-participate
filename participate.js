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

	$("#" + gfHtmlID(escapeHtml(name)) + "_tr").remove();
	Poll.updateSum();
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
	tr += "<td class='date'>";
	tr += columns.lastTD || "";
	tr += "</td>";
	tr += "</tr>";
	$("#participants").append(tr);

	Poll.sort();
};

/**
 * Updates the Sum with the specified +- values
 * columns is an Object, usually containing
 * elements in {-1,0,1} for each column
 */
Poll.modifySum = function (columns) {
	$.each(Poll.columns, function (i, col) {
		var colElem = $("#" + gfHtmlID("sum_" + col)),
			newSum = parseInt(colElem.text(), 10) + columns[col],
			percentage = newSum * 100 / $(".participantrow").size();

		colElem.text(newSum);

		colElem.attr({
			'title': Math.round(percentage).toString() + " %",
			'class': "sum match_" + (Math.round(percentage / 10) * 10).toString()
		});
	});
};

Poll.updateSum = function () {
	var sum = {total: $("#participants tr").length};
	$.each(Poll.columns, function (colI, col) {
		sum[col] = {};
		$.each(Poll.Strings.vals, function (i, val) {
			sum[col][val] = 0;
		});
		$.each($("#participants tr"), function (pI, p) {
			var user = $(p).find("td.name").text(),
				cur = $(p).find("[title='" + user + ": " + col + "']").text();
			$.each(Poll.Strings.vals, function (i, val) {
				if (Poll.Strings[val].parsedSymb === cur) {
					sum[col][val] += 1;
				}
			});
		});
		sum[col].unknown = sum.total - sum[col].yes - sum[col].no - sum[col].maybe;

		var colElem = $("#" + gfHtmlID("sum_" + col)),
			newSum = sum[col].yes, title = "",
			undecided = sum[col].maybe + sum[col].unknown,
			percentage = newSum * 100 / sum.total;

		colElem.text(newSum);

		if (undecided !== 0) {
			title += "(+" + (undecided) + "?) ";
		}

		title += Math.round(percentage).toString() + "%";

		if (undecided !== 0) {
			title += "-" + Math.round((undecided + newSum) * 100 / sum.total).toString() + "%";
		}

		colElem.attr({
			'title': title,
			'class': "sum match_" + (Math.round(percentage / 10) * 10).toString()
		});
	});
};

Poll.additionalParseNaddFuncts = [];
Poll.parseNaddHook = function (func) {
	Poll.additionalParseNaddFuncts.push(func);
};
Poll.parseNaddRow = function (name, columns) {
	var colsHtml, colsSum = {}, curPrepFunc = 0, parseNaddHookRec;
	
	// go recursively through all preparation functions
	parseNaddHookRec = function () {
		if (curPrepFunc < Poll.additionalParseNaddFuncts.length) {
			curPrepFunc++;
			Poll.additionalParseNaddFuncts[curPrepFunc - 1](name, columns, parseNaddHookRec);
		} else {
			// we are ready
			colsHtml = {name: columns.name};

			if (columns.editUser && columns.deleteUser) {
				colsHtml.firstTD = "<span class='edituser'>";
				colsHtml.firstTD += "<a href='javascript:" + columns.editUser + "(\"" + name + "\")' title='" + printf(_("Edit User %1 ..."), [name]) + "'>";
				colsHtml.firstTD += Poll.Strings.Edit + "</a>";
				colsHtml.firstTD += " | ";
				colsHtml.firstTD += "<a href='javascript:" + columns.deleteUser + "(\"" + name + "\")' title='" + printf(_("Delete User %1 ..."), [name]) + "'>";
				colsHtml.firstTD += Poll.Strings.Delete + "</a></span>";
			}

			$.each(Poll.columns, function (i, col) {
				var avail = columns[col],
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

			if (columns.time) {
				colsHtml.lastTD = columns.time.toString(Date.CultureInfo.formatPatterns.fullDateTime);
			}
			Poll.addRow(name, colsHtml);
			Poll.updateSum();
		}
	};
	parseNaddHookRec();

};

Poll.oldParticipantRow = [];
Poll.exchangeAddParticipantRow = function (newInnerTR) {
	if (typeof(newInnerTR) === 'undefined') {
		$("#add_participant").replaceWith(Poll.oldParticipantRow.pop().clone());
	} else {
		Poll.oldParticipantRow.push($("#add_participant"));
		$("#add_participant").replaceWith("<tr id='add_participant'>" + newInnerTR + "</tr>");
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
 *     $("#savebutton").value(_("Next));
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

/**
 * exchanges the Users row with the participate-row
 * stores old userrow in Poll.currentEditUser
 */
Poll.editUser = function (user) {
	if (Poll.currentEditUser) {
		Poll.cancelEdit();
	}

	Poll.oldParticipantRow.push($("#add_participant"));

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
	var tr = '<tr id="' + id + '" class="participantrow">';
	tr += '<td colspan="' + (Poll.columns.length + 3) + '" >' + tdInnerHtml + '</td>';
	tr += '</tr>';
	$("#separator_top").before(tr);
	return $("#" + id);
};

Poll.hint = function (message, divClass) {
	var id = "error_" + Math.round(Math.random() * 10000);
	divClass = divClass || "hint";
	Poll.addParticipantTR(id, "<div class='" + divClass + "'>" + escapeHtml(message) + "</div>");
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


var lastSortCol = Poll.columns.length + 2;
Poll.sort = function (sortCol) {
	var to_comp, trAry, reverse = false;

	if (typeof(sortCol) === 'undefined') {
		sortCol = lastSortCol;
	} else {
		if (sortCol === lastSortCol) {
			if ($($(".header")[sortCol]).hasClass("headerSort")) {
				reverse = true;
			} 
		}
		lastSortCol =  sortCol;
	}

	to_comp = (function () {
		switch (sortCol) {
		case 0: // Name
			return function (s) {
				return s.toUpperCase();
			};
		case Poll.columns.length + 1: // Last Change
			return function (date) {
				var d = Date.parse(date);
				if (!d) {
					d = new Date(date);
				}
				return d.getTime();
			};
		default:
			return function (s) {
				var ret = 1.5; // value for unknown
				$.each(Poll.Strings.vals, function (i, val) {
					if (s === Poll.Strings[val].parsedSymb) {
						ret = i;
					}
				});
				return ret;
			};
		}
	}());

	trAry = $("#participanttable tr.participantrow").sort(function (a, b) {
		var valA, valB;
		valA = to_comp($($(a).find("td")[sortCol + 1]).text());
		valB = to_comp($($(b).find("td")[sortCol + 1]).text());
		return (valA < valB) ? -1 : (valA > valB) ? 1 : 0;
	}).toArray();
	$(".headerSort").removeClass("headerSort");
	$(".headerSortReverse").removeClass("headerSortReverse");
	if (reverse) {
		$($("#participanttable th a")[sortCol]).addClass("headerSortReverse");
		trAry.reverse();
	} else {
		$($("#participanttable th a")[sortCol]).addClass("headerSort");
	}

	$("#participanttable tr.participantrow").remove();
	$("tbody#participants").append(trAry);
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

