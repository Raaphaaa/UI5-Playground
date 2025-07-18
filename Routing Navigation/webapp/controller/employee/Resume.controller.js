sap.ui.define(
  ["sap/ui/demo/nav/controller/BaseController"],
  function (BaseController) {
    "use strict";

    return BaseController.extend("sap.ui.demo.nav.controller.employee.Resume", {
      onInit: function () {
        let oRouter = this.getRouter();
        oRouter
          .getRoute("employeeResume")
          .attachMatched(this._onRouteMatched, this);
      },

      _onRouteMatched: function (oEvent) {
        let oArgs, oView;
        oArgs = oEvent.getParameter("arguments");
        oView = this.getView();
        oView.bindElement({
          path: "/Employees(" + oArgs.employeeId + ")",
          events: {
            change: this._onBindingChange.bind(this),
            dataRequested: function (oEvent) {
              oView.setBusy(true);
            },
            dataReceived: function (oEvent) {
              oView.setBusy(false);
            },
          },
        });
      },

      _onBindingChange: function (oEvent) {
        if (!this.getView().getBindingContext()) {
          this.getRouter().getTargets().display("notFound");
        }
      },
    });
  }
);
