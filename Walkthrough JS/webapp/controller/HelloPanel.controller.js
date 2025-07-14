sap.ui.define(
  ["sap/ui/core/mvc/Controller", "sap/m/MessageToast"],
  (Controller, MessageToast) => {
    "use strict";

    return Controller.extend("ui5.walkthrough.controller.HelloPanel", {
      onShowHello() {
        // read msg from i18n model
        const oBundle = this.getView().getModel("i18n").getResourceBundle();
        const sRecipient = this.getView()
          .getModel()
          .getProperty("/recipient/name");
        const sMsg = oBundle.getText("helloMsg", [sRecipient]);

        // show message
        MessageToast.show(sMsg);
      },
      async onOpenDialog(oEvent) {
        // ??= means that only when oDialog is not bound or null, a new fragment is created
        MessageToast.show(oEvent.getSource().getId());
        this.oDialog ??= await this.loadFragment({
          name: "ui5.walkthrough.view.helloDialog",
        });
        this.oDialog.open();
      },

      onCloseDialog() {
        this.byId("helloDialog").close();
      },

      showHelloText() {
        const oBundle = this.getView().getModel("i18n").getResourceBundle();
        const sRecipient = this.getView()
          .getModel()
          .getProperty("/recipient/name");
        return oBundle.getText("helloMsg", [sRecipient]);
      },
    });
  }
);
