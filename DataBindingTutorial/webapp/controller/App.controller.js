sap.ui.define(
    ["sap/m/library", "sap/ui/core/mvc/Controller", "sap/ui/model/type/Currency", "sap/m/ObjectAttribute"],
    (mobileLibrary, Controller, Currency, ObjectAttribute) => {
        "use strict";

        return Controller.extend("ui5.databinding.controller.App", {
            formatMail(sFirstName, sLastName) {
                const oBundle = this.getView().getModel("i18n").getResourceBundle();

                return mobileLibrary.URLHelper.normalizeEmail(
                    `${sFirstName}.${sLastName}@mibs-ag.de`,
                    oBundle.getText("mailSubject", [sFirstName]),
                    oBundle.getText("mailBody")
                );
            },

            formatStockValue(fUnitPrice, iStockLevel, sCurrCode) {
                const oCurrency = new Currency();
                return oCurrency.formatValue([fUnitPrice * iStockLevel, sCurrCode], "string");
            },

            onItemSelected(oEvent) {
                const oSelectedItem = oEvent.getSource();
                const oContext = oSelectedItem.getBindingContext("products");
                const sPath = oContext.getPath();
                const oProductDetailPanel = this.byId("productDetailsPanel");
                oProductDetailPanel.bindElement({
                    path: sPath,
                    model: "products",
                });

                let oImage;
                oImage = this.byId("cardImage").clone();
            },

            productListFactory(sId, oContext) {
                // factory is called for each ListItem
                // sId consists of <ListId>-<Index>
                // oContext holds the current ListItem Context
                let oUIControl;

                if (oContext.getProperty("UnitsInStock") === 0 && oContext.getProperty("Discontinued")) {
                    oUIControl = this.byId("productSimple").clone(sId);
                } else {
                    oUIControl = this.byId("productExtended").clone(sId);

                    if (oContext.getProperty("UnitsInStock") < 1) {
                        oUIControl.addAttribute(
                            new ObjectAttribute({
                                text: {
                                    path: "i18n>outOfStock",
                                },
                            })
                        );
                    }
                }
                return oUIControl;
            },

            onSelectionChange(oEvent) {
                const oListItem = oEvent.getParameters().listItem;
                if (oListItem.getHighlight() === "Warning") {
                    oListItem.setHighlight("None");
                } else {
                    oListItem.setHighlight("Warning");
                }
            },

            onPressShowEntries() {
                const aProductListItems = this.byId("ProductList").getItems();

                for (let oItem of aProductListItems) {
                    if (oItem.getVisible() === false) {
                        oItem.setVisible(true);
                        oItem.setSelected(true);
                    }
                }
                this.updateStats();
            },

            onPressHideEntries() {
                const aProductListItems = this.byId("ProductList").getItems();

                for (let oItem of aProductListItems) {
                    if (oItem.getSelected() === true) {
                        oItem.setVisible(false);
                        oItem.setSelected(false);
                    }
                }
                this.updateStats();
            },

            onDrop(oEvent) {
                let oDragged = oEvent.getParameter("draggedControl");
                let oDropped = oEvent.getParameter("droppedControl");

                let oDraggedCard = oDragged.getBindingContext("cards").getObject();
                let oDroppedCard = oDropped.getBindingContext("cards").getObject();

                let oCards = this.getView().getModel("cards");
                let aCards = oCards.getProperty("/cards");
                let pos1 = aCards.indexOf(oDraggedCard);
                let pos2 = aCards.indexOf(oDroppedCard);

                let bTopCard = oDraggedCard.topCard;
                oDraggedCard.topCard = oDroppedCard.topCard;
                oDroppedCard.topCard = bTopCard;
                aCards[pos1] = oDroppedCard;
                aCards[pos2] = oDraggedCard;

                oCards.setProperty("/cards", aCards);
            },

            updateStats() {
                const aProductListItems = this.byId("ProductList").getItems();

                let totalPrice = 0;
                let totalUnitsInStock = 0;
                let count = 0;
                let countDiscontinued = 0;

                for (let oItem of aProductListItems) {
                    if (oItem.getVisible() === true) {
                        let oItemBinding = oItem.getBindingContext("products");
                        totalPrice += Number(oItemBinding.getProperty("UnitPrice"));
                        totalUnitsInStock += oItemBinding.getProperty("UnitsInStock");
                        count += 1;
                        if (oItemBinding.getProperty("Discontinued") === false) {
                            countDiscontinued += 1;
                        }
                    }
                }

                const oStats = this.getView().getModel("stats");
                oStats.setProperty("/totalPrice", totalPrice.toFixed(2));
                oStats.setProperty("/averagePrice", (totalPrice / count).toFixed(2));
                oStats.setProperty("/totalUnitsInStock", totalUnitsInStock);
                oStats.setProperty("/averageUnitsInStock", (totalUnitsInStock / count).toFixed(2));
                oStats.setProperty("/pricePerUnit", (totalUnitsInStock / totalPrice).toFixed(2));
                oStats.setProperty("/discontinuedItems", countDiscontinued);
            },
            onPressImage(oEvent) {
                let oItem = oEvent.getSource().getBindingContext("cards");
                oItem.setProperty("selected", !oItem.getProperty("selected"));
            },

            formatEnhancement(sEnhancement) {
                return "pictures/Enhancements/" + sEnhancement + ".png";
            },

            formatValue(sColor, sValue) {
                return "pictures/" + sColor + "/" + sValue + ".png";
            },

            formatSeal(sSeal) {
                if (sSeal === "") {
                    return "pictures/Seals/Blank.png";
                }
                return "pictures/Seals/" + sSeal + ".png";
            },

            formatEdition(sEdition) {
                if (sEdition === "") {
                    return;
                }
                return "pictures/Editions/" + sEdition + ".png";
            },

            onDrawCard() {
                let oCards = this.getView().getModel("cards");
                let aCards = oCards.getProperty("/cards");
                if (aCards.length > 0) {
                    aCards[aCards.length - 1].topCard = false;
                }
                aCards.push({
                    enhancement: this.getRandomEnhancement(),
                    color: this.getRandomColor(),
                    value: this.getRandomValue(),
                    seal: this.getRandomSeal(),
                    edition: this.getRandomEdition(),
                    topCard: true,
                    selected: false,
                });
                oCards.setProperty("/cards", aCards);
                oCards.setProperty("/length", aCards.length);
            },

            onDiscardCards() {
                let oCards = this.getView().getModel("cards");
                let aCards = oCards.getProperty("/cards");
                if (aCards.length > 0) {
                    aCards[aCards.length - 1].topCard = false;
                }
                for (let oCard of aCards) {
                    if (oCard.selected === true) {
                        aCards = aCards.toSpliced(aCards.indexOf(oCard), 1);
                    }
                }
                if (aCards.length > 0) {
                    aCards[aCards.length - 1].topCard = true;
                }
                oCards.setProperty("/cards", aCards);
                oCards.setProperty("/length", aCards.length);
            },

            onSortSuitwise() {
                let oCards = this.getView().getModel("cards");
                let aCards = oCards.getProperty("/cards");

                if (aCards.length > 0) {
                    aCards[aCards.length - 1].topCard = false;
                    aCards.sort((a, b) => {
                        if (a.color > b.color) {
                            return -1;
                        }
                        if (a.color < b.color) {
                            return 1;
                        }
                        return 0;
                    });
                    aCards[aCards.length - 1].topCard = true;
                    oCards.setProperty("/cards", aCards);
                }
            },

            onSortRankwise() {
                let oCards = this.getView().getModel("cards");
                let aCards = oCards.getProperty("/cards");
                if (aCards.length > 0) {
                    aCards[aCards.length - 1].topCard = false;
                    aCards.sort((a, b) => a.value - b.value);
                    aCards[aCards.length - 1].topCard = true;
                    oCards.setProperty("/cards", aCards);
                }
            },

            onDropCards(oEvent) {
                let oDragged = oEvent.getParameter("draggedControl");
                let oDropped = oEvent.getParameter("droppedControl");
            },

            getRandomEnhancement() {
                let iRandomNumber = this.getRandomInt(0, 8);
                switch (iRandomNumber) {
                    case 0:
                        return "Base";
                    case 1:
                        return "Bonus";
                    case 2:
                        return "Glass";
                    case 3:
                        return "Gold";
                    case 4:
                        return "Lucky";
                    case 5:
                        return "Mult";
                    case 6:
                        return "Steel";
                    case 7:
                        return "Stone";
                }
            },
            getRandomSeal() {
                let iRandomNumber = this.getRandomInt(0, 5);
                switch (iRandomNumber) {
                    case 0:
                        return "red";
                    case 1:
                        return "blue";
                    case 2:
                        return "purple";
                    case 3:
                        return "gold";
                    case 4:
                        return "";
                }
            },
            getRandomEdition() {
                let iRandomNumber = this.getRandomInt(0, 5);
                switch (iRandomNumber) {
                    case 0:
                        return "negative";
                    case 1:
                        return "foil";
                    case 2:
                        return "holo";
                    case 3:
                        return "poly";
                    case 4:
                        return "";
                }
            },
            getRandomColor() {
                let iRandomNumber = this.getRandomInt(0, 4);
                switch (iRandomNumber) {
                    case 0:
                        return "H";
                    case 1:
                        return "C";
                    case 2:
                        return "S";
                    case 3:
                        return "D";
                }
            },
            getRandomValue() {
                return this.getRandomInt(2, 14);
            },

            getRandomInt(iMin, iMax) {
                const minCeiled = Math.ceil(iMin);
                const maxFloored = Math.floor(iMax);
                return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled);
            },
        });
    }
);
