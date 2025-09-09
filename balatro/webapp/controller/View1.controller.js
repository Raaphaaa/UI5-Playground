sap.ui.define(
    ["balatro/balatro/model/formatter", "balatro/balatro/controller/BaseController", "sap/ui/model/json/JSONModel"],
    (formatter, BaseController, JSONModel) => {
        "use strict";

        return BaseController.extend("balatro.balatro.controller.View1", {
            formatter: formatter,
            onInit() {
                BaseController.prototype.onInit.apply(this, arguments);
                this.oModel = this.getOwnerComponent().getModel();
                this.oDeckSelectionModel = new JSONModel({ CurrentDeck: 1 });
                this.getView().setModel(this.oDeckSelectionModel, "DeckModel");
            },

            onStartGame() {
                let oNewGame = this.oModel.createEntry("/Game", {
                    properties: {
                        DeckNr: this.oDeckSelectionModel.getProperty("/CurrentDeck"),
                    },
                    success: function () {
                        let mParameters = {
                            GameId: oNewGame.getProperty("GameId"),
                        };
                        this.oModel.callFunction("/initCards", {
                            method: "POST",
                            urlParameters: mParameters,
                            eTag: this.oModel.getETag(null, oNewGame),
                            success: function () {
                                this.getRouter().navTo("HandCards", {
                                    GameId: oNewGame.getProperty("GameId"),
                                });
                            }.bind(this),
                        });
                    }.bind(this),
                });
                this.oModel.submitChanges();
            },

            onDeckLeft() {
                let currentDeck = this.oDeckSelectionModel.getProperty("/CurrentDeck");
                if (currentDeck == 1) {
                    currentDeck = 15;
                } else {
                    currentDeck -= 1;
                }
                this.oDeckSelectionModel.setProperty("/CurrentDeck", currentDeck);
            },

            onDeckRight() {
                let currentDeck = this.oDeckSelectionModel.getProperty("/CurrentDeck");
                if (currentDeck == 15) {
                    currentDeck = 1;
                } else {
                    currentDeck += 1;
                }
                this.oDeckSelectionModel.setProperty("/CurrentDeck", currentDeck);
            },
        });
    }
);
