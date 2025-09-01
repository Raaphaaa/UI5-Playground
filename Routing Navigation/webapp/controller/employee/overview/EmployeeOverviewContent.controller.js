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
          let oRouter = this.getRouter();

          this._oTable = this.byId("employeesTable");
          this._oVSD = null;
          this._sSortField = null;
          this._bSortDescending = false;
          this._aValidSortFields = ["EmployeeID", "FirstName", "LastName"];
          this._sSearchQuery = null;

          this._initViewSettingsDialog();

          oRouter
            .getRoute("employeeOverview")
            .attachMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function (oEvent) {
          this._oRouterArgs = oEvent.getParameter("arguments");
          // "||" logical OR-operator --> if first argument is false(in this case initial) the second argument is passed over
          this._oRouterArgs["?query"] = this._oRouterArgs["?query"] || {};

          this._applySearchFilter(this._oRouterArgs["?query"].search);
        },

        onSortButtonPressed: function () {
          this._oVSD.open();
        },

        onSearchEmployeesTable: function (oEvent) {
          let oRouter = this.getRouter();
          // write the current search value to the attribute
          // ["?query"] creates a new field ?query in the _oRouterArge structure.
          // .serach specifies that ?query itself is a deep structure and creates the "search" field inside

          // ["?query"]["search"] would have the same effect
          //  .?query.search would not work due to the "?" which is an invalid character for direct field access
          this._oRouterArgs["?query"].search = oEvent.getSource().getValue();
          oRouter.navTo("employeeOverview", this._oRouterArgs, true);
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
          // if sSearchQuery exists(!= null/undefined/NaN/...) && length > 0
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
