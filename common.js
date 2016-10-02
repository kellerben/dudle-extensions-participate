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
/*global Gettext */

if (typeof(Poll) === "undefined") {
	var Poll = {};
} else {
	alert("Somebody captured the Namespace 'Poll'!!!");	
}
Poll.Strings = {};

var gt = new Gettext({ 'domain' : 'dudle' });
function _(msgid) { 
	return gt.gettext(msgid); 
}
function printf(msg, replaceary) {
	return Gettext.strargs(msg, replaceary); 
}
function escapeQuotes(s) {
	return s.replace(/"/g, '').replace(/'/g, "");
}
function escapeHtml(s) {
	return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function unescapeHtml(s) {
	return s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
}

/**********************************************************
 * remove non-standard characters to give a valid html id *
 * thanks to 
 * http://stackoverflow.com/users/18771/tomalak
 * and
 * http://stackoverflow.com/users/160173/david-murdoch
 **********************************************************/
var gfHtmlID = (function () {
	var cache = {},
	    ncache = {},
	    reg = /[^A-Za-z0-9_\-]/g;
	return function (s) {
		var id;
		if (s in cache) {
			id = cache[s];
		} else {
			id = s.replace(reg, "_");
			if (id in ncache) {
				id += ncache[id]++;
			}
			ncache[id] = 0;
			cache[s] = id;
		}
		return id;
	};
}());


/* returns firefox, ie, opera, safari, chrome, unknown */
function gfBrowserName() {
	var agent, i, browsers;
	agent = navigator.userAgent.toLowerCase();
	browsers =  ["chrome", "epiphany", "opera", "safari", "firefox", "ie"];
	for	(i = 0; i < browsers.length; i++) {
		if (agent.indexOf(browsers[i]) > -1) {
			return browsers[i];
		}
	}
	return "unknown";
}

function cloneObject(source) {
	for (var i in source) {
		if (typeof source[i] === 'source') {
			this[i] = new cloneObject(source[i]);
		} else {
			this[i] = source[i];
		}
	}
}
// clone objects, from:
// http://my.opera.com/GreyWyvern/blog/show.dml/1725165
//Object.prototype.clone = function() {
//  var newObj = (this instanceof Array) ? [] : {};
//  for (i in this) {
//    if (i == 'clone') continue;
//    if (this[i] && typeof this[i] == "object") {
//      newObj[i] = this[i].clone();
//    } else newObj[i] = this[i]
//  } return newObj;
//};

function gfHasLocalStorage() {
	return 'localStorage' in window && window['localStorage'] !== null;
}

function gfStoreLocal(key, val) {
	if (gfHasLocalStorage()) {
		localStorage[key] = val;
		return true;
	} else {
		return false;
	}
}

function gfGetLocal(key) {
	if (gfHasLocalStorage()) {
		return localStorage[key];
	} else {
		return undefined;
	}
}


/* 
 * Stores a key=value pair under the namespace extID
 * value might include
 * {
 *   success: successfunc,
 *   error: errorfunc,
 *   read_passwd: "some_optional_password",
 *   write_passwd_old: "some_optional_old_password",
 *   write_passwd_new: "some_optional_new_password"
 */
Poll.store = function (extID, key, value) {
	var successfunc, errorfunc, params = arguments[3] || {};
	params.pollID = Poll.ID;
	params.extID = extID;
	params.service = "store";
	params.key = key;
	params.value = value;

	if (params.success) {
		successfunc = params.success;
		delete params.success;
	}
	if (params.error) {
		errorfunc = params.error;
		delete params.error;
	} else {
		errorfunc =  function (e) { 
			alert("Error (" + e.status + ") in Poll.store: " + e.responseText); 
		};
	}
	$.ajax({
		url: Poll.extDir + "/webservices.cgi",
		data: params,
		type: "POST",
		success: successfunc,
		error: errorfunc
	});
};

Poll.load = function (extID, key) {
	var successfunc, errorfunc, params = arguments[2] || {};
	params.pollID = Poll.ID;
	params.extID = extID;
	params.service = "load";
	params.key = key;

	if (params.success) {
		successfunc = params.success;
		delete params.success;
	}
	if (params.error) {
		errorfunc = params.error;
		delete params.error;
	} else {
		errorfunc =  function (e) { 
			alert("Error (" + e.status + ") in Poll.load: " + e.responseText); 
		};
	}
	$.ajax({
		url: Poll.extDir + "/webservices.cgi",
		data: params,
		method: "get",
		success: function (resp) {
			if (params.type === "json") {
				var r = JSON.parse(resp);
				r.time = new Date(r.time);
				successfunc(r);
			} else {
				successfunc(resp);
			}
		},
		error: errorfunc
	});
};

Poll.addRow = function (columns) {
	var tr,t;
	tr = $("<tr />", {
		'class' : 'participantrow',
		'id'    : columns.id + "_tr"
	});

	t = $("<td />");
	t.append(columns.firstTD || "");
	tr.append(t);

	tr.append(
	 $("<td />", {
		"class" : 'name',
	 })
		.append(columns.before_name || "")
		.append($("<span/>", {"text" : columns.name || ""}))
		.append(columns.after_name || "")
	);

	$.each(Poll.columns, function (i) {
		tr.append(columns[Poll.columns[i]]);
	});

	tr.append("<td/>",{
		"class":'date',
		"text" : columns.lastTD || ""
	});
	$("#participants").append(tr);

	Poll.sort();
};

Poll.lastSortCol = -1;
Poll.sort = function (sortCol) {
	if (Poll.lastSortCol === -1) {
		Poll.lastSortCol = Poll.columns.length + 2;
	}
	var to_comp, trAry, reverse = false;

	if (typeof(sortCol) === 'undefined') {
		sortCol = Poll.lastSortCol;
	} else {
		if (sortCol === Poll.lastSortCol) {
			if ($($(".header")[sortCol]).hasClass("headerSort")) {
				reverse = true;
			} 
		}
		Poll.lastSortCol =  sortCol;
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
	$("tbody#participants").append(trAry);
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

Poll.participantRowTitle = function (username, column) {
	return username + ": " + column;
};


Poll.additionalParseNaddFuncts = [];
Poll.parseNaddHook = function (func) {
	Poll.additionalParseNaddFuncts.push(func);
};
Poll.parseNaddRow = function (columns) {
	var colsHtml, colsSum = {}, curPrepFunc = 0, parseNaddHookRec;
	columns.id = gfHtmlID(escapeHtml(columns.name));
	
	// go recursively through all preparation functions
	parseNaddHookRec = function () {
		if (curPrepFunc < Poll.additionalParseNaddFuncts.length) {
			curPrepFunc++;
			Poll.additionalParseNaddFuncts[curPrepFunc - 1](columns, parseNaddHookRec);
		} else {
			// we are ready
			colsHtml = {
				name: columns.name, 
				before_name: columns.before_name,
				after_name: columns.after_name,
				id: columns.id
			};

			if (columns.editUser && columns.deleteUser) {
				colsHtml.firstTD = $("<span class='edituser'>");
				colsHtml.firstTD.append($("<a/>", {
						"title": printf(_("Edit User %1 ..."), [columns.name]),
							"href" : "#"
					}).click(function(){columns.editUser(columns.id)})
						.append(Poll.Strings.Edit)
				);

				colsHtml.firstTD.append(" | ");

				colsHtml.firstTD.append($("<a/>",{
						"title": printf(_("Delete User %1 ..."), [columns.name]),
					}).click(function(){columns.deleteUser(columns.id)})
						.append(Poll.Strings.Delete)
				);
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
				colsHtml[col] = $("<td/>",{
					"class" : tdClass,
					"title" : Poll.participantRowTitle(columns.name, col)
				}).append(tdText);
				colsSum[col] = avail === Poll.Strings.yes.val ? 1 : 0;
			});

			if (columns.time) {
				colsHtml.lastTD = columns.time.toString(Date.CultureInfo.formatPatterns.fullDateTime);
			}
			Poll.addRow(colsHtml);
			Poll.updateSum();
		}
	};
	parseNaddHookRec();

};
