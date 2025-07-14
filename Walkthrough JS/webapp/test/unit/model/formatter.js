sap.ui.define([
    "ui5/walkthrough/model/formatter",
    "sap/ui/model/resource/ResourceModel"
], (formatter, ResourceModel) => {
    "use strict";

    QUnit.module("Formatting functions", {});

    QUnit.test("Should return the translated texts", (assert) => {
        // ENGLISH
        const oResourceModel = new ResourceModel({
            bundleUrl: sap.ui.require.toUrl("ui5/walkthrough/i18n/i18n_en.properties"),
            supportedLocales: [
                ""
            ],
            fallbacklocale: ""
        });
        const oControllerMock = {
            getOwnerComponent() {
                return {
                    getModel() {
                        return oResourceModel;
                    }
                };
            }
        };
        const fnIsolatedFormatter = formatter.statusText.bind(oControllerMock);

        assert.strictEqual(fnIsolatedFormatter("A"), "New", "The long text for Status A is correct");
        assert.strictEqual(fnIsolatedFormatter("B"), "In Progress", "The long text for Status B is correct");
        assert.strictEqual(fnIsolatedFormatter("C"), "Done", "The long text for Status C is correct");
        assert.strictEqual(fnIsolatedFormatter("Foo"), "Foo", "The long text for Status Foo is correct");



        // GERMAN
        const oResourceModel2 = new ResourceModel({
            bundleUrl: sap.ui.require.toUrl("ui5/walkthrough/i18n/i18n_de.properties"),
            supportedLocales: [
                ""
            ],
            fallbacklocale: ""
        });
        const oControllerMock2 = {
            getOwnerComponent() {
                return {
                    getModel() {
                        return oResourceModel2;
                    }
                };
            }
        };
        const fnIsolatedFormatter2 = formatter.statusText.bind(oControllerMock2);

        assert.strictEqual(fnIsolatedFormatter2("A"), "Neu", "The long text for Status A is correct");
        assert.strictEqual(fnIsolatedFormatter2("B"), "In Bearbeitung", "The long text for Status B is correct");
        assert.strictEqual(fnIsolatedFormatter2("C"), "Abgeschlossen", "The long text for Status C is correct");
        assert.strictEqual(fnIsolatedFormatter2("Foo"), "Foo", "The long text for Status Foo is correct");
    });
});