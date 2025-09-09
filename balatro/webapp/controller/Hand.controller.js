sap.ui.define(
    [
        "balatro/balatro/model/formatter",
        "balatro/balatro/controller/BaseController",
        "sap/ui/model/Filter",
        "sap/ui/model/FilterOperator",
        "sap/ui/model/json/JSONModel",
    ],
    (formatter, BaseController, Filter, FilterOperator, JSONModel) => {
        "use strict";

        return BaseController.extend("balatro.balatro.controller.Hand", {
            formatter: formatter,
            onInit() {
                BaseController.prototype.onInit.apply(this, arguments);

                this.getRouter().getRoute("HandCards").attachMatched(this._onRouteMatched, this);

                let oConfig = new JSONModel({
                    totalwidth: 1000,
                    height: 150,
                    width: 100,
                });
                this.getView().setModel(oConfig, "CardConfig");
            },

            _onRouteMatched(oEvent) {
                let oArgs = oEvent.getParameter("arguments");
                let oView = this.getView();

                let oKey = this.oModel.createKey("/Game", {
                    GameId: oArgs.GameId,
                });

                oView.bindElement({
                    path: oKey,
                    parameters: {
                        expand: "to_Cards",
                    },
                });
                this._filterHandCards();
            },

            onSelectCard(oEvent) {
                let oCard = oEvent.getSource().getBindingContext();
                console.log(oCard);
                this.oModel.setProperty(
                    oCard.getPath() + "/IsSelected",
                    !this.oModel.getProperty(oCard.getPath() + "/IsSelected")
                );
                this.oModel.submitChanges();
            },

            onDrop(oEvent) {
                let oDragged = oEvent.getParameter("draggedControl").getBindingContext();
                let oDropped = oEvent.getParameter("droppedControl").getBindingContext();

                let aCards = this.oModel.getProperty("Cards");
                console.log(aCards);
            },

            _filterHandCards() {
                let oCardTable = this.getView().byId("HBoxHandCards");
                let oFilter = new Filter("IsHandcard", FilterOperator.EQ, false);
                oCardTable.getBinding("items").filter(oFilter);
            },
        });
    }
);
