sap.ui.define(
  [
    "sap/ui/core/Messaging",
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/model/Sorter",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/FilterType",
    "sap/ui/model/json/JSONModel",
  ],
  function (
    Messaging,
    Controller,
    MessageToast,
    MessageBox,
    Sorter,
    Filter,
    FilterOperator,
    FilterType,
    JSONModel
  ) {
    "use strict";

    return Controller.extend("sap.ui.core.tutorial.odatav4.controller.App", {
      /**
       *  Hook for initializing the controller
       */
      onInit: function () {
        let oMessageModel = Messaging.getMessageModel(),
          oMessageModelBinding = oMessageModel.bindList(
            "/",
            undefined,
            [],
            new Filter("technical", FilterOperator.EQ, true)
          ),
          oViewModel = new JSONModel({
            busy: false,
            hasUIChanges: false,
            usernameEmpty: false,
            order: 0,
          });

        this.getView().setModel(oViewModel, "appView");
        this.getView().setModel(oMessageModel, "message");

        oMessageModelBinding.attachChange(this.onMessageBindingChange, this);
        this._bTechnicalErrors = false;
      },

      onCreate: function () {
        let oList = this.byId("peopleList"),
          oBinding = oList.getBinding("items"),
          oContext = oBinding.create({
            UserName: "",
            FirstName: "",
            LastName: "",
            Age: "18",
          });

        this._setUIChanges();
        this.getView().getModel("appView").setProperty("/usernameEmpty", true);

        oList.getItems().some(function (oItem) {
          if (oItem.getBindingContext() === oContext) {
            oItem.focus();
            oItem.setSelected(true);
            return true;
          }
        });
      },

      onDelete: function (oEvent) {
        let oContext,
          oPeopleList = this.byId("peopleList"),
          oSelected = oPeopleList.getSelectedItem(),
          sUserName;

        if (oSelected) {
          oContext = oSelected.getBindingContext();
          sUserName = oContext.getProperty("UserName");
          oContext.delete().then(
            function () {
              MessageToast.show(
                this._getText("deletionSuccessMessage", [sUserName])
              );
            }.bind(this),
            function (oError) {
              if (
                oContext === oPeopleList.getSelectedItem().getBindingContext()
              ) {
                this._setDetailArea(oContext);
              }
              this._setUIChanges();
              if (oError.canceled) {
                MessageToast.show(
                  this._getText("deletionRestoreMessage", [sUserName])
                );
                return;
              }
              MessageBox.error(oError.message + ":" + sUserName);
            }.bind(this)
          );
          this._setDetailArea();
          this._setUIChanges(true);
        }
      },

      onInputChange: function (oEvent) {
        if (oEvent.getParameter("escPressed")) {
          this._setUIChanges();
        } else {
          this._setUIChanges(true);
          if (
            oEvent
              .getSource()
              .getParent()
              .getBindingContext()
              .getProperty("UserName")
          ) {
            this.getView()
              .getModel("appView")
              .setProperty("/usernameEmpty", false);
          }
        }
      },

      onRefresh: function () {
        let oBinding = this.byId("peopleList").getBinding("items");

        if (oBinding.hasPendingChanges()) {
          MessageBox.error(this._getText("refreshNotPossibleMessage"));
          return;
        }
        oBinding.refresh();
        MessageToast.show(this._getText("refreshSuccessMessage"));
      },

      onResetChanges: function () {
        this.byId("peopleList").getBinding("items").resetChanges();
        this._bTechnicalErrors = false;
        this._setUIChanges();
      },

      onResetDataSource: function () {
        let oModel = this.getView().getModel(),
          oOperation = oModel.bindContext("/ResetDataSource(...)");
        oOperation.invoke().then(
          function () {
            oModel.refresh();
            MessageToast.show(this._getText("sourceResetSuccessMessage"));
          }.bind(this),
          function (oError) {
            MessageBox.error(oError.message);
          }
        );
      },

      onSearch: function () {
        let oView = this.getView(),
          sValue = oView.byId("searchField").getValue(),
          oFilter = new Filter("LastName", FilterOperator.Contains, sValue);
        oView
          .byId("peopleList")
          .getBinding("items")
          .filter(oFilter, FilterType.Application);
      },

      onSave: function () {
        let fnSuccess = function () {
          this._setBusy(false);
          MessageToast.show(this._getText("changesSentMessage"));
          this._setUIChanges(false);
        }.bind(this);
        let fnError = function (oError) {
          this._setBusy(false);
          this._setUIChanges(false);
          MessageBox.error(oError.message);
        }.bind(this);

        this._setBusy(true); // lock until submit is resolved
        this.getView()
          .getModel()
          .submitBatch("peopleGroup")
          .then(fnSuccess, fnError);
        this._bTechnicalErrors = false;
      },

      onSort: function () {
        let oView = this.getView(),
          aStates = [undefined, "asc", "desc"],
          aStateTextIds = ["sortNone", "sortAscending", "sortDescending"],
          sMessage,
          iOrder = oView.getModel("appView").getProperty("/order");

        iOrder = (iOrder + 1) % aStates.length;
        let sOrder = aStates[iOrder];

        oView.getModel("appView").setProperty("/order", iOrder);
        oView
          .byId("peopleList")
          .getBinding("items")
          .sort(sOrder && new Sorter("LastName", sOrder === "desc"));

        sMessage = this._getText("sortMessage", [
          this._getText(aStateTextIds[iOrder]),
        ]);
        MessageToast.show(sMessage);
      },

      onMessageBindingChange: function (oEvent) {
        let aContexts = oEvent.getSource().getContexts(),
          aMessages,
          bMessageOpen = false;
        if (bMessageOpen || !aContexts.length) {
          return;
        }

        aMessages = aContexts.map(function (oContext) {
          return oContext.getObject();
        });
        sap.ui.getCore().getMessageManager().removeMessage(aMessages);

        this._setUIChanges(true);
        this._bTechnicalErrors = true;
        MessageBox.error(aMessages[0].message, {
          id: "serviceErrorMessageBox",
          onClose: function () {
            bMessageOpen = false;
          },
        });
        bMessageOpen = true;
      },

      onSelectionChange: function (oEvent) {
        this._setDetailArea(
          oEvent.getParameter("listItem").getBindingContext()
        );
      },

      _getText: function (sTextId, aArgs) {
        return this.getOwnerComponent()
          .getModel("i18n")
          .getResourceBundle()
          .getText(sTextId, aArgs);
      },

      _setUIChanges: function (bHasUIChanges) {
        if (this._bTechnicalErrors) {
          bHasUIChanges = true;
        } else if (bHasUIChanges === undefined) {
          bHasUIChanges = this.getView().getModel().hasPendingChanges();
        }
        let oModel = this.getView().getModel("appView");
        oModel.setProperty("/hasUIChanges", bHasUIChanges);
      },

      _setBusy: function (bIsBusy) {
        let oModel = this.getView().getModel("appView");
        oModel.setProperty("/busy", bIsBusy);
      },

      _setDetailArea: function (oUserContext) {
        let oDetailArea = this.byId("detailArea"),
          oLayout = this.byId("defaultLayout"),
          oOldContext,
          oSearchField = this.byId("searchField");
        if (!oDetailArea) {
          return; // do nothing when running within view destruction
        }

        oOldContext = oDetailArea.getBindingContext();
        if (oOldContext) {
          oOldContext.setKeepAlive(false);
        }
        if (oUserContext) {
          oUserContext.setKeepAlive(true, this._setDetailArea.bind(this));
        }

        oDetailArea.setBindingContext(oUserContext || null);
        oDetailArea.setVisible(!!oUserContext);
        oLayout.setSize(oUserContext ? "60%" : "100%");
        oLayout.setResizable(!!oUserContext);
        oSearchField.setWidth(oUserContext ? "40%" : "20%");
      },
    });
  }
);
