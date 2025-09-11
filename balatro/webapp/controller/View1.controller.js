sap.ui.define(
    [
        "balatro/balatro/model/formatter",
        "balatro/balatro/controller/BaseController",
        "sap/ui/model/json/JSONModel",
        "sap/ui/model/Filter",
        "sap/ui/model/FilterOperator",
        "sap/m/MessageBox",
    ],
    (formatter, BaseController, JSONModel, Filter, FilterOperator, MessageBox) => {
        "use strict";

        return BaseController.extend("balatro.balatro.controller.View1", {
            formatter: formatter,
            onInit() {
                BaseController.prototype.onInit.apply(this, arguments);
                this.getRouter().getRoute("RouteView1").attachMatched(this._onRouteMatched, this);
                this.oModel = this.getOwnerComponent().getModel();
                this.oDeckSelectionModel = new JSONModel({
                    CurrentDeck: 1,
                    HasOldGame: false,
                });
                this.getView().setModel(this.oDeckSelectionModel, "DeckModel");
            },

            _onRouteMatched() {
                this._checkForOldGame();
            },

            onNewGame() {
                let oBinding = this.getView().getElementBinding();
                if (oBinding) {
                    MessageBox.confirm("Hierdurch wird dein alter Spielstand mit diesem Deck gelöscht!", {
                        title: "Spielstand überschreiben",
                        onClose: (sAction) => {
                            if (sAction === MessageBox.Action.OK) {
                                console.log(oBinding);

                                // delete the ongoing Game before creating a new instance
                                this.oModel.remove(oBinding.getPath(), {
                                    success: function () {
                                        this._createNewGame();
                                    }.bind(this),
                                });
                                this.oModel.submitChanges();
                            }
                        },
                    });
                } else {
                    this._createNewGame();
                }
            },

            onContinueGame() {
                let oBinding = this.getView().getBindingContext();
                this.getRouter().navTo("HandCards", {
                    GameId: oBinding.getProperty("GameId"),
                });
            },

            _createNewGame() {
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
                this._checkForOldGame();
            },

            onDeckRight() {
                let currentDeck = this.oDeckSelectionModel.getProperty("/CurrentDeck");
                if (currentDeck == 15) {
                    currentDeck = 1;
                } else {
                    currentDeck += 1;
                }
                this.oDeckSelectionModel.setProperty("/CurrentDeck", currentDeck);
                this._checkForOldGame();
            },

            _checkForOldGame() {
                let oFilter = new Filter(
                    "DeckNr",
                    FilterOperator.EQ,
                    this.oDeckSelectionModel.getProperty("/CurrentDeck")
                );
                this.oModel.read("/Game", {
                    filters: [oFilter],
                    success: function (oData) {
                        if (oData.results.length > 0) {
                            this.oDeckSelectionModel.setProperty("/HasOldGame", true);
                            // bind old Game to View to display stats
                            let oKey = this.oModel.createKey("/Game", {
                                GameId: oData.results[0].GameId,
                            });
                            this.getView().bindElement({
                                path: oKey,
                            });
                        } else {
                            this.oDeckSelectionModel.setProperty("/HasOldGame", false);
                            this.getView().unbindElement();
                        }
                    }.bind(this),
                    error: function (oError) {
                        // Error = Reading Model not possible
                        console.log(oError);
                    },
                });
            },
        });
    }
);
