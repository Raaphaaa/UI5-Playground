/*global QUnit*/

sap.ui.define([
	"balatro/manage/balatro/controller/appHome.controller"
], function (Controller) {
	"use strict";

	QUnit.module("appHome Controller");

	QUnit.test("I should test the appHome controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
