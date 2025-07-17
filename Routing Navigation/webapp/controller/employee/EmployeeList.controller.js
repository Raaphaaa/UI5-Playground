sap.ui.define(
  ["sap/ui/demo/nav/controller/BaseController"],
  function (BaseController) {
    "use strict";

    return BaseController.extend(
      "sap.ui.demo.nav.controller.employee.EmployeeList",
      {
        onListItemPressed: function (oEvent) {
          let oItem, oContext;
          oItem = oEvent.getSource();
          oContext = oItem.getBindingContext();
          this.getRouter().navTo("employee", {
            employeeId: oContext.getProperty("EmployeeID"),
          });
        },
      }
    );
  }
);
