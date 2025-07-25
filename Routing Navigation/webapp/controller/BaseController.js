sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/routing/History",
    "sap/ui/core/UiComponent",
  ],
  function (Controller, History, UIComponent) {
    "use strict";

    return Controller.extend("sap.ui.demo.nav.BaseController", {
      getRouter: function () {
        return UIComponent.getRouterFor(this);
      },

      onNavBack: function () {
        let oHistory, sPreviousHash;

        oHistory = History.getInstance();
        sPreviousHash = oHistory.getPreviousHash();

        if (sPreviousHash !== undefined) {
          window.history.go(-1);
        } else {
          this.getRouter().navTo("appHome", {}, true);
        }
      },
    });
  }
);
