sap.ui.define(
    [
        "balatro/balatro/model/formatter",
        "balatro/balatro/controller/BaseController",
        "sap/ui/model/Filter",
        "sap/ui/model/FilterOperator",
        "sap/ui/model/Sorter",
        "sap/ui/model/json/JSONModel",
        "sap/ui/table/Column",
        "sap/m/Label",
        "sap/m/Text",
    ],
    (formatter, BaseController, Filter, FilterOperator, Sorter, JSONModel, Column, Label, Text) => {
        "use strict";

        return BaseController.extend("balatro.balatro.controller.Hand", {
            formatter: formatter,
            onInit() {
                BaseController.prototype.onInit.apply(this, arguments);

                this.getRouter().getRoute("HandCards").attachMatched(this._onRouteMatched, this);
            },

            _onRouteMatched(oEvent) {
                let oArgs = oEvent.getParameter("arguments");
                let oView = this.getView();

                this.oKey = this.oModel.createKey("/Game", {
                    GameId: oArgs.GameId,
                });
                this._RefreshModelData();

                oView.bindElement({
                    path: this.oKey,
                    parameters: {
                        expand: "to_Cards",
                    },
                });

                // zuvor noch Daten aus Backend auslesen mit TC_ID, PROTOCOL_ID usw.
                this.getView().byId("TreeTable").removeAllColumns();
                this._generateTableColumns();
                this._mapTableData();

                // const oTreeTable = this.getView().byId("TreeTable");
                // let oNewCol = new sap.ui.table.Column({
                //     label: new sap.m.Label({ text: "Color" }),
                //     template: new sap.m.Text({ text: "{NeuesKartenModel>Color}" }),
                // });
                // oTreeTable.addColumn(oNewCol);
                // oNewCol = new sap.ui.table.Column({
                //     label: new sap.m.Label({ text: "Value" }),
                //     template: new sap.m.Text({ text: "{NeuesKartenModel>Value}" }),
                // });
                // oTreeTable.addColumn(oNewCol);
            },

            _generateTableColumns() {
                const oModel = this.getView().getModel("data").oData;
                this.tableColumns = [...new Set(oModel.map((d) => `${d.FIELDNAME}`))];

                this.tableColumns.forEach(function (sColumnName) {
                    const oTreeTable = this.getView().byId("TreeTable");
                    const sDescr = oModel.find(
                        (item) => item.FIELDNAME === sColumnName && item.FIELD_DESCR
                    )?.FIELD_DESCR;
                    let oNewColumn = new Column({
                        label: new Label({ text: sDescr ?? sColumnName }),
                        template: new Text({ text: `{mappedData>${sColumnName}}` }),
                    });
                    oTreeTable.addColumn(oNewColumn);
                }, this);
            },

            _mapTableData() {
                const oModel = this.getView().getModel("data").oData;
                const grouped = {};

                for (const item of oModel) {
                    const actual = item.LINE_ACTUAL * 2;
                    const expected = actual + 1;
                    if (!grouped[actual]) {
                        grouped[actual] = { LINE_ACTUAL: actual };
                        grouped[expected] = { LINE_ACTUAL: expected };
                    }
                    grouped[actual][item.FIELDNAME] = item.VALUE_ACTUAL;
                    grouped[expected][item.FIELDNAME] = item.VALUE_EXPECTED;
                }
                let oMappedData = new JSONModel({ mappedData: grouped });
                this.getView().setModel(oMappedData, "mappedData");

                // Oder als Einzeiler:
                // this.getView().setModel(
                //     new JSONModel({
                //         mappedData: this.getView()
                //             .getModel("data")
                //             .oData.reduce((g, i) => {
                //                 const a = i.LINE_ACTUAL * 2,
                //                     e = a + 1;
                //                 if (!g[a]) {
                //                     g[a] = { LINE_ACTUAL: a };
                //                     g[e] = { LINE_ACTUAL: e };
                //                 }
                //                 g[a][i.FIELDNAME] = i.VALUE_ACTUAL;
                //                 g[e][i.FIELDNAME] = i.VALUE_EXPECTED;
                //                 return g;
                //             }, {}),
                //     }),
                //     "mappedData"
                // );
            },

            _RefreshModelData() {
                this.oModel.read(this.oKey + "/to_Cards", {
                    filters: [new Filter({ path: "IsHandcard", operator: FilterOperator.EQ, value1: true })],
                    success: function (oData) {
                        if (oData.results.length > 0) {
                            let aCards = oData.results;
                            let aNewData = aCards.map((c) => ({
                                Color: c.Color,
                                Value: c.Value,
                                IsHandCard: c.IsHandcard,
                                IsSelected: c.IsSelected,
                                DisplayPos: c.DisplayPos,
                                Enhancement: c.Enhancement,
                                Edition: c.Edition,
                                Seal: c.Seal,
                            }));
                            this.getView().getModel("cards").setProperty("/cards", aNewData);
                        }
                    }.bind(this),
                    // for (let i = 0; i < aCards.length; i += 2) {
                    //     aNewData.push({
                    //         Color: aCards[i].Color,
                    //         Value: aCards[i + 1].Value,
                    //         IsHandCard: true,
                    //         IsSelected: true,
                    //         DisplayPos: aCards[i].DisplayPos,
                    //         Enhancement: aCards[i].Enhancement,
                    //         Edition: aCards[i].Edition,
                    //         Seal: aCards[i].Seal,
                    //     });
                    // }
                    // const uniqueCardSet = [...new Set(aNewData.map((Card) => `${Card.Color}|${Card.Value}`))];
                    // const uniqueColumns = uniqueCardSet.map((key) => {
                    //     const [Color, Value] = key.split("|");
                    //     return { Color, Value };
                    // });
                    // console.log(uniqueColumns);
                });
            },

            onSelectCard(oEvent) {
                let oCard = oEvent.getSource().getBindingContext("cards");
                const oModel = oCard.getModel();
                oModel.setProperty(
                    oCard.getPath() + "/IsSelected",
                    !oCard.getProperty(oCard.getPath() + "/IsSelected")
                );
            },

            onDrop(oEvent) {
                // swap the 2 cards that were dragged/dropped
                let oDragged = oEvent.getParameter("draggedControl").getBindingContext("cards").getPath();
                let oDropped = oEvent.getParameter("droppedControl").getBindingContext("cards").getPath();

                let pos1 = this.getView()
                    .getModel("cards")
                    .getProperty(oDragged + "/DisplayPos");
                let pos2 = this.getView()
                    .getModel("cards")
                    .getProperty(oDropped + "/DisplayPos");

                this.getView()
                    .getModel("cards")
                    .setProperty(oDragged + "/DisplayPos", pos2);
                this.getView()
                    .getModel("cards")
                    .setProperty(oDropped + "/DisplayPos", pos1);

                this._sortCards();
                this.getView().getModel("Settings").setProperty("/currentlySortedBy", null);
            },

            _sortCards() {
                const oBinding = this.byId("HBoxHandCards").getBinding("items");
                oBinding.sort([new sap.ui.model.Sorter("DisplayPos")]);
            },

            sortByColor() {
                let aCards = this._getAllCards().sort(function (a, b) {
                    // different colored cards
                    if (a.data.Color < b.data.Color) return -1;
                    if (a.data.Color > b.data.Color) return 1;

                    // same color --> sort by Value
                    return a.data.Value - b.data.Value;
                });

                aCards.forEach(
                    function (card, index) {
                        const oModel = this.getView().getModel("cards");
                        oModel.setProperty(card.path + "/DisplayPos", index + 1);
                    }.bind(this),
                    this
                );

                this._sortCards();
                this.getView().getModel("Settings").setProperty("/currentlySortedBy", "Color");
            },

            sortByValue() {
                let aCards = this._getAllCards().sort(function (a, b) {
                    // different values
                    if (a.data.Value < b.data.Value) return -1;
                    if (a.data.Value > b.data.Value) return 1;

                    if (a.data.Color < b.data.Color) return -1;
                    if (a.data.Color > b.data.Color) return 1;
                });

                aCards.forEach(
                    function (card, index) {
                        const oModel = this.getView().getModel("cards");
                        oModel.setProperty(card.path + "/DisplayPos", index + 1);
                    }.bind(this),
                    this
                );

                this._sortCards();
                this.getView().getModel("Settings").setProperty("/currentlySortedBy", "Value");
            },

            onDrawCard() {
                console.log(this.getView().byId("HBoxHandCards").getBinding("items"));
                let oBinding = this.getView().getElementBinding().oElementContext;
                let oParams = { GameId: oBinding.getProperty("GameId"), amount: 1 };
                this.oModel.callFunction("/drawCards", {
                    method: "POST",
                    urlParameters: oParams,
                    etag: this.oModel.getETag(null, oBinding),
                    success: function () {
                        this._RefreshModelData();

                        console.log(this.getView().byId("HBoxHandCards").getBinding("items"));
                        switch (this.getView().getModel("Settings").getProperty("/currentlySortedBy")) {
                            case "Color":
                                this.sortByColor();
                                break;

                            case "Value":
                                this.sortByValue();
                                break;

                            default:
                                let aCards = this._getAllCards();
                                aCards.forEach(function (card, index) {
                                    this.getView()
                                        .getModel("cards")
                                        .setProperty(card.path + "/DisplayPos", index + 1);
                                }, this);
                                this._sortCards();
                        }
                    }.bind(this),
                });
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
