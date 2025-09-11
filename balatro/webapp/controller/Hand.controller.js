sap.ui.define(
    [
        "balatro/balatro/model/formatter",
        "balatro/balatro/controller/BaseController",
        "sap/ui/model/Filter",
        "sap/ui/model/FilterOperator",
        "sap/ui/model/Sorter",
        "sap/ui/model/json/JSONModel",
    ],
    (formatter, BaseController, Filter, FilterOperator, Sorter, JSONModel) => {
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
                this.oModel.setProperty(
                    oCard.getPath() + "/IsSelected",
                    !this.oModel.getProperty(oCard.getPath() + "/IsSelected")
                );
            },

            onDrop(oEvent) {
                // swap the 2 cards that were dragged/dropped
                let oDragged = oEvent.getParameter("draggedControl").getBindingContext().getPath();
                let oDropped = oEvent.getParameter("droppedControl").getBindingContext().getPath();

                let pos1 = this.oModel.getProperty(oDragged + "/DisplayPos");
                let pos2 = this.oModel.getProperty(oDropped + "/DisplayPos");

                this.oModel.setProperty(oDragged + "/DisplayPos", pos2);
                this.oModel.setProperty(oDropped + "/DisplayPos", pos1);
            },

            _filterHandCards() {
                let oCardTable = this.getView().byId("HBoxHandCards");
                let oFilter = new Filter("IsHandcard", FilterOperator.EQ, false);
                oCardTable.getBinding("items").filter(oFilter);
            },

            sortByColor() {
                let aCards = this._getAllCards().sort(function (a, b) {
                    // different colored cards
                    if (a.data.Color < b.data.Color) return -1;
                    if (a.data.Color > b.data.Color) return 1;

                    // same color --> sort by Value
                    return a.data.Value - b.data.Value;
                });

                aCards.forEach(function (card, index) {
                    this.oModel.setProperty(card.path + "/DisplayPos", index + 1);
                }, this);
            },

            sortByValue() {
                let aCards = this._getAllCards().sort(function (a, b) {
                    // different values
                    if (a.data.Value < b.data.Value) return -1;
                    if (a.data.Value > b.data.Value) return 1;

                    if (a.data.Color < b.data.Color) return -1;
                    if (a.data.Color > b.data.Color) return 1;
                });

                aCards.forEach(function (card, index) {
                    this.oModel.setProperty(card.path + "/DisplayPos", index + 1);
                }, this);
            },

            _getAllCards() {
                let oBinding = this.getView().byId("HBoxHandCards").getBinding("items");
                if (!oBinding) {
                    sap.m.MessageToast.show("Keine Items gefunden");
                    return;
                }

                // collect all contexts
                let aContexts = oBinding.getContexts();
                if (!aContexts || aContexts.length === 0) {
                    sap.m.MessageToast.show("Keine Karten zum Sortieren gefunden");
                    return;
                }

                return aContexts.map(function (oContext) {
                    return {
                        context: oContext,
                        data: oContext.getObject(),
                        path: oContext.getPath(),
                    };
                });
            },
        });
    }
);
