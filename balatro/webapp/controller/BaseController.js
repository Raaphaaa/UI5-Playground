sap.ui.define(
    ["sap/ui/core/mvc/Controller", "sap/ui/core/routing/History"],
    (Controller, History) => {
        "use strict";

        return Controller.extend("balatro.balatro.controller.BaseController", {
            // Initilize //
            onInit: function () {
                this.oModel = this.getOwnerComponent().getModel();
            },

            getRouter: function () {
                return this.getOwnerComponent().getRouter();
            },

            onNavBack: function () {
                const oHistory = History.getInstance();
                const sPreviousHash = oHistory.getPreviousHash();

                if (sPreviousHash !== undefined) {
                    window.history.go(-1);
                } else {
                    this.getRouter().navTo("RouteView1", {});
                }
            },
        });
    }
);
