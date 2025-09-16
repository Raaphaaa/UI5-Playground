sap.ui.define(["sap/ui/core/mvc/Controller", "sap/ui/core/routing/History"], (Controller, History) => {
    "use strict";

    return Controller.extend("balatro.balatro.controller.BaseController", {
        // Initilize //
        onInit: function () {
            this.oModel = this.getOwnerComponent().getModel();
            window.addEventListener("beforeunload", this._onBeforeUnload.bind(this));
        },

        getRouter: function () {
            return this.getOwnerComponent().getRouter();
        },

        onNavBack: function () {
            const oHistory = History.getInstance();
            const sPreviousHash = oHistory.getPreviousHash();

            this.oModel.submitChanges();
            // if (this.oModel.hasPendingChanges()) {
            //     this.oModel.resetChanges();
            // }
            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                this.getRouter().navTo("RouteView1", {});
            }
        },

        _onBeforeUnload() {
            if (this.oModel.hasPendingChanges()) {
                this.oModel.submitChanges();
            }
        },
    });
});
