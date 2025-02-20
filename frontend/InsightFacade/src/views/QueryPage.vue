<template>
  <v-container>
    <v-row>
      <router-link to="/">
        <v-btn color="primary">
          <v-icon>mdi-home</v-icon>
          Return Home
        </v-btn>
      </router-link>
    </v-row>

    <v-row>
      <v-spacer></v-spacer>
    </v-row>

    <v-row>
      <v-col>
        <span class="title font-weight-bold">Perform Query</span>
      </v-col>
    </v-row>

    <v-form @submit.prevent="submitQuery">

      <v-row>
        <v-col>
          <v-select
            v-model="selectedDataset"
            :items="uploadedDatasets"
            label="Select Dataset To Query"
            required
          >
<!--            <template v-slot:selection="{ item }">-->
<!--              <v-list-item>-->
<!--                  <v-list-item-title>{{ item.id }}</v-list-item-title>-->
<!--                  <v-list-item-subtitle>{{ item.kind }}</v-list-item-subtitle>-->
<!--              </v-list-item>-->
<!--            </template>-->
<!--            <template v-slot:item="{ id, kind, numRows }">-->
<!--              <v-list-item>-->
<!--                  <v-list-item-title>{{ id }}</v-list-item-title>-->
<!--                  <v-list-item-subtitle>{{ kind }}</v-list-item-subtitle>-->
<!--              </v-list-item>-->
<!--            </template>-->
          </v-select>
        </v-col>
        <v-col>
          <v-btn color="primary" @click="listDatasets">
            <v-icon>mdi-refresh</v-icon>
            Refresh Datasets
          </v-btn>
        </v-col>
      </v-row>


      <v-row v-for="(comparison, index) in comparisons" :key="index">
        <v-col>
          <v-select
            v-model="comparison.comparisonSelection"
            :items="comparisonOptions"
            label="Select Comparison"
          ></v-select>
        </v-col>

        <v-col>
          <v-select
            v-model="comparison.comparisonType"
            :items="comparisonTypes"
            label="Comparison Type"
          ></v-select>
        </v-col>

        <v-col>
          <v-text-field v-model="comparison.comparisonValue" label="Comparison Value"></v-text-field>
        </v-col>

        <v-col>
          <v-select
            v-model="comparison.logicOperator"
            :items="logicOperators"
            label="Logic Operator"
          ></v-select>
        </v-col>

        <v-col v-if="index > 0">
          <v-btn @click="removeComparison(index)" icon>
            <v-icon>mdi-minus</v-icon>
          </v-btn>
        </v-col>
      </v-row>

      <v-btn @click="addComparison" color="primary">Add Comparison</v-btn>

      <v-row>
        <v-col>
          <v-select
            v-model="columnSelection"
            :items="columnOptions"
            label="Select Columns"
            multiple
          ></v-select>
        </v-col>
      </v-row>

      <v-row>
        <v-col>
          <v-select
            v-model="orderBy"
            :items="orderByOptions"
            label="Order By"
          ></v-select>
        </v-col>
      </v-row>

      <v-row>
        <v-btn type="submit" color="primary">Submit Query</v-btn>
      </v-row>

      <v-row>
        <div v-if="queryErrorMessage" class="error-message" style="color:red">
          {{ queryErrorMessage }}
        </div>
      </v-row>

<!--      <v-row>-->
<!--        <v-col>-->
<!--          <div v-if="queryResult" class="query-result">-->
<!--            {{ queryResult }}-->
<!--          </div>-->
<!--        </v-col>-->
<!--      </v-row>-->

      <v-row>
        <v-data-table-virtual
          v-if="queryResult"
          :headers="tableHeaders"
          :items="queryResult"
          height="400"
          item-value="name"
        ></v-data-table-virtual>
      </v-row>

    </v-form>
  </v-container>
</template>

<script>
export default {
  data() {
    return {
      comparisons: [
        {
          comparisonSelection: "",
          comparisonType: "",
          comparisonValue: "",
          logicOperator: "",
        },
      ],
      uploadedDatasets: ["no datasets or not yet loaded"],
      selectedDataset: "",
      logicOperators: ["AND", "OR"],
      comparisonTypes: ["LT", "GT", "EQ"],
      // logicOperator: "",
      // comparisonType: "",
      // comparisonValue: "",
      columnOptions: ["avg", "pass", "fail", "audit", "year", "dept", "id", "instructor", "title", "uuid"],
      columnSelection: [],
      orderByOptions: ["avg", "pass", "fail", "audit", "year", "dept", "id", "instructor", "title", "uuid"],
      comparisonOptions: ["avg", "pass", "fail", "audit", "year", "dept", "id", "instructor", "title", "uuid"],
      orderBy: "",

      queryResult: [],
      queryErrorMessage: "",
      tableHeaders: [],
    };
  },
  methods: {
    addComparison() {
      this.comparisons.push({
        comparisonSelection: "",
        comparisonType: "",
        comparisonValue: "",
        logicOperator: "",
      });
    },
    removeComparison(index) {
      this.comparisons.splice(index, 1);
    },
    submitQuery() {
      // Build and submit the query based on user inputs
      for (let i = 0; i < this.columnSelection.length; i++) {
        this.columnSelection[i] = `${this.selectedDataset}_${this.columnSelection[i]}`;
      }
      if (this.orderBy) {
        this.orderBy = `${this.selectedDataset}_${this.orderBy}`;
      }

      const query = {
            WHERE: this.buildWhereClause(),
          OPTIONS: {
            COLUMNS: this.columnSelection,
            ORDER: this.orderBy
          }
        }


      // const queryEx =
      //   {
      //     WHERE: {
      //       GT: {
      //         sections_avg: 83
      //       }
      //     },
      //     OPTIONS: {
      //       COLUMNS: [
      //         "sections_dept",
      //         "sections_avg"
      //       ],
      //       ORDER: "sections_avg"
      //     }
      //   }

      // Send the query to the backend
      fetch(
        `http://localhost:4321/query`,
        {
          method: "POST",
          body: JSON.stringify(query),
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
        .then((res) => res.json())
        .then((res) => {
          console.log(res);
          // this.queryResult = JSON.stringify(res.result);
          this.queryResult = res.result;
          if (this.queryResult.length === 0) {
            this.queryErrorMessage = "No results found";
          }
          this.tableHeaders = Object.keys(res.result[0]);

          for (let i = 0; i < this.tableHeaders.length; i++) {
            this.tableHeaders[i] = { title: this.tableHeaders[i], align: 'start', key: this.tableHeaders[i] };
            // this.tableHeaders[i].key = `${this.selectedDataset}_${this.tableHeaders[i].key}`;
          }

          console.log("tableHeaders: ", this.tableHeaders);
          this.queryErrorMessage = "";
          // clear the form
          this.comparisons = [
            {
              comparisonSelection: "",
              comparisonType: "",
              comparisonValue: "",
              logicOperator: "",
            },
          ];
          this.columnSelection = [];
          this.orderBy = "";
        })
        .catch((err) => {
          console.error(err)
          this.queryErrorMessage = err;
          this.comparisons = [
            {
              comparisonSelection: "",
              comparisonType: "",
              comparisonValue: "",
              logicOperator: "",
            },
          ];
          this.columnSelection = [];
          this.orderBy = "";
          // this.queryErrorMessage = await response.json.error;
        }
      )
    },
    buildWhereClause() {
      let whereClause = {};
      this.comparisons.forEach((comparison, index) => {
        // whereClause[`LOGIC${index + 1}`] = comparison.logicOperator; // add back later FLAG
        // whereClause[`FILTER${index + 1}`] =
        //   {
        //   [comparison.comparisonType]: {
        //     [`${this.selectedDataset}_${comparison.comparisonSelection}`]: comparison.comparisonValue,
        //   },
        // };

        // turn comparisonValue to number for some comparisonSelections
        if (comparison.comparisonSelection === "avg" || comparison.comparisonSelection === "pass" || comparison.comparisonSelection === "fail" || comparison.comparisonSelection === "audit" || comparison.comparisonSelection === "year") {
          comparison.comparisonValue = Number(comparison.comparisonValue);
        }

        whereClause = {
          // [comparison.logicOperator]: [

              [comparison.comparisonType]: {
                [`${this.selectedDataset}_${comparison.comparisonSelection}`]: comparison.comparisonValue,
              },

            // whereClause,
          // ],
        };

      });
      return whereClause;
    },
    listDatasets() {
      // Implement the logic to handle dataset listing
      // called after successful dataset addition and on refresh

      fetch('http://localhost:4321/datasets').then((response) => {
        if (response.status === 200) {
          response.json().then((data) => {
            this.uploadedDatasets = data.result;
            for (let i = 0; i < this.uploadedDatasets.length; i++) {
              this.uploadedDatasets[i] = this.uploadedDatasets[i].id;
            }
            console.log('this.uploadedDatasets :', this.uploadedDatasets);
          });
        } else {
          console.error('Dataset listing failed');
        }
      });
    },

  }
};
</script>
