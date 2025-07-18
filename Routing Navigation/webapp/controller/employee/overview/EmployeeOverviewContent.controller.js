sap.ui.define(
  [
    "sap/ui/demo/nav/controller/BaseController",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/Sorter",
    "sap/m/ViewSettingsDialog",
    "sap/m/ViewSettingsItem",
  ],
  function (
    BaseController,
    Filter,
    FilterOperator,
    Sorter,
    ViewSettingsDialog,
    ViewSettingsItem
  ) {
    "use strict";

    return BaseController.extend(
      "sap.ui.demo.nav.controller.employee.overview.EmployeeOverviewContent",
      {
        onInit: function () {
          this._oTable = this.byId("employeesTable");
          this._oVSD = null;
          this._sSortField = null;
          this._bSortDescending = false;
          this._aValidSortFields = ["EmployeeID", "FirstName", "LastName"];
          this._sSearchQuery = null;

          this._initViewSettingsDialog();
        },

        onSortButtonPressed: function () {
          this._oVSD.open();
        },

        onSearchEmployeesTable: function (oEvent) {
          //Value of Input-Search-Field
          this._applySearchFilter(oEvent.getSource().getValue());
        },

        _initViewSettingsDialog: function () {
          this._oVSD = new ViewSettingsDialog("vsd", {
            confirm: function (oEvent) {
              let oSortItem = oEvent.getParameter("sortItem");
              this._applySorter(
                oSortItem.getKey(),
                oEvent.getParameter("sortDescending")
              );
            }.bind(this),
          });
          this._oVSD.addSortItem(
            new ViewSettingsItem({
              key: "EmployeeID",
              text: "Employee ID",
              selected: true,
            })
          );
          this._oVSD.addSortItem(
            new ViewSettingsItem({
              key: "FirstName",
              text: "First Name",
              selected: false,
            })
          );
          this._oVSD.addSortItem(
            new ViewSettingsItem({
              key: "LastName",
              text: "Last Name",
              selected: false,
            })
          );
        },

        _applySearchFilter: function (sSearchQuery) {
          let aFilters, oFilter, oBinding;
          if (this._sSearchQuery === sSearchQuery) {
            return;
          }
          this._sSearchQuery = sSearchQuery;
          this.byId("searchField").setValue(sSearchQuery);

          aFilters = [];
          if (sSearchQuery && sSearchQuery.length > 0) {
            aFilters.push(
              new Filter("FirstName", FilterOperator.Contains, sSearchQuery)
            );
            aFilters.push(
              new Filter("LastName", FilterOperator.Contains, sSearchQuery)
            );
            oFilter = new Filter({ filters: aFilters, and: false });
          } else {
            oFilter = null;
          }

          oBinding = this._oTable.getBinding("items");
          oBinding.filter(oFilter, "Application");
        },

        _applySorter: function (sSortField, sortDescending) {
          let bSortDescending, oBinding, oSorter;

          if (sSortField && this._aValidSortFields.indexOf(sSortField) > -1) {
            if (typeof sortDescending === "string") {
              bSortDescending = sortDescending === "true";
            } else if (typeof sortDescending === "boolean") {
              bSortDescending = sortDescending;
            } else {
              bSortDescending = false;
            }

            if (
              this._sSortField &&
              this._sSortField === sSortField &&
              this._bSortDescending === bSortDescending
            ) {
              return;
            }

            this._sSortField = sSortField;
            this._bSortDescending = bSortDescending;
            oSorter = new Sorter(sSortField, bSortDescending);

            this._syncViewSettingDialogSorter(sSortField, bSortDescending);

            oBinding = this._oTable.getBinding("items");
            oBinding.sort(oSorter);
          }
        },

        _syncViewSettingDialogSorter: function (sSortField, bSortDescending) {
          this._oVSD.setSelectedSortItem(sSortField);
          this._oVSD.setSortDescending(bSortDescending);
        },
      }
    );
  }
);
