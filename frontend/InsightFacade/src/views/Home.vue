<template>
  <v-container>
    <v-row>
      <v-col>
        <span class="title font-weight-bold">Upload a Dataset</span>
      </v-col>
    </v-row>
    <v-row>
      <v-select v-model="selectedKind"
      :items="datasetKinds"
      label="Select Dataset Kind"
      required
      ></v-select>
    </v-row>
    <v-row>
      <span class="caption">Enter the ID of the dataset you want to upload (no underscores, not blank, doesn't already exist)</span>
    </v-row>
    <v-row>
      <v-text-field v-model="datasetId" label="Dataset ID"></v-text-field>
    </v-row>

    <v-row>
<!--      <v-col>-->
<!--        <v-file-input-->
<!--          v-model="sectionsFile"-->
<!--          label="Upload Sections Dataset (ZIP)"-->
<!--          accept=".zip"-->
<!--          @input="uploadDataset"-->
<!--        ></v-file-input>-->
<!--      </v-col>-->
      <v-col>
        <v-file-input
          v-model="fileUpload"
          label="Upload Dataset (ZIP)"
          accept=".zip"
        ></v-file-input>
      </v-col>

    </v-row>

    <v-row>
      <v-btn color="primary" @click="uploadDataset">Upload Dataset</v-btn>
    </v-row>

    <v-row>
      <div v-if="uploadErrorMessage" class="error-message" style="color:red">
        {{ uploadErrorMessage }}
      </div>
    </v-row>
    <v-row>
      <div v-if="invalidDatasetIDReason" class="error-message" style="color:red">
        {{ invalidDatasetIDReason }}
      </div>
    </v-row>

    <v-row>
      <v-col>
        <v-divider></v-divider>
      </v-col>
    </v-row>

    <v-row>
      <v-col>
        <span class="title font-weight-bold">Uploaded Datasets</span>
        <v-card>
<!--          <v-list title="Rooms" :datasets="uploadedDatasets"></v-list>-->
          <v-list title="Rooms">
            <v-list-item v-for="dataset in uploadedDatasets" :key="dataset.id">
              <!-- Render individual dataset properties, e.g., dataset.id, dataset.kind, dataset.numRows -->
              <v-card-text>
                <v-list-item-title>{{ dataset.id }}</v-list-item-title>
                <v-list-item-subtitle>{{ dataset.kind }}</v-list-item-subtitle>
                <v-list-item-subtitle>{{ dataset.numRows }}</v-list-item-subtitle>
              </v-card-text>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-btn color="primary" @click="listDatasets">
        <v-icon>mdi-refresh</v-icon>
         Refresh
      </v-btn>
    </v-row>

    <v-row>
      <v-col>
        <v-divider></v-divider>
      </v-col>
    </v-row>

    <v-row>
      <v-col>
        <span class="title font-weight-bold">Remove a Dataset</span>
        <br>
        <span class="caption">Enter the ID of the dataset you want to remove</span>
      </v-col>
    </v-row>
    <v-row>
      <v-text-field v-model="removeID" label="Dataset ID"></v-text-field>
    </v-row>

    <v-row>
      <v-btn color="primary" @click="deleteDataset">Remove Dataset</v-btn>
    </v-row>

    <v-row>
      <div v-if="removeDatasetErrorMessage" class="error-message" style="color:red">
        {{ removeDatasetErrorMessage }}
      </div>
    </v-row>

    <v-row>
      <v-col>
        <v-divider></v-divider>
      </v-col>
    </v-row>

    <v-row>
      <router-link to="/query">
        <v-btn color="primary">
          <v-icon>mdi-magnify</v-icon>
           Perform Query
        </v-btn>
      </router-link>
    </v-row>

  </v-container>
</template>

<script>
import * as fs from "fs";

export default {
  data() {
    return {
      datasetKinds: ['sections', 'rooms'],
      selectedKind: null,
      datasetId: null,
      // sectionsFile: null,
      fileUpload: null,
      uploadedDatasets: [],
      uploadErrorMessage: null,
      invalidDatasetIDReason: null,

      removeID: null,
      removeDatasetErrorMessage: null,
    };
  },
  methods: {
    uploadDataset() {
      try {
        this.uploadErrorMessage = null;
        this.invalidDatasetIDReason = null;

        if (this.selectedKind && this.datasetId && this.fileUpload) {
          const fileReader = new FileReader();
          const file = this.fileUpload[0];

          // Listen for the 'load' event to be notified when the reading is complete
          fileReader.onload = (event) => {
            // const payload = event.target.result; // This is the content of the file as a base64-encoded string
            const payload = event.target.result
            console.log('payload :', payload);

            fetch(`http://localhost:4321/dataset/${this.datasetId}/${this.selectedKind}`, {
              method: 'PUT',
              body: payload,
              headers: {
                'Content-Type': 'application/x-zip-compressed',
              },
            }).then(async (response) => {
              if (response.status === 200) {
                console.log('Dataset uploaded successfully');
                this.uploadErrorMessage = "Dataset uploaded successfully, can now be used in queries";
                this.listDatasets();
              } else {
                const errorResponse = await response.json();
                if (errorResponse.error === 'Invalid dataset id') {
                  // if whitespace
                  console.log('this.datasetId invalid:', this.datasetId)
                  if (this.datasetId.trim() === '') {
                    this.invalidDatasetIDReason = 'Dataset ID cannot be blank or only contain whitespace';
                  } else if (this.datasetId.includes('_')) {
                    this.invalidDatasetIDReason = 'Dataset ID cannot contain underscores';
                  }
                  // this.invalidDatasetIDReason = errorResponse;
                }
                this.uploadErrorMessage = errorResponse.error;
                console.log('Dataset upload failed:', errorResponse);
              }
            }).catch((err) => {
              console.error(err);
            });
          };

          // Read the content of the file
          fileReader.readAsArrayBuffer(file);
          console.log('fileReader :', fileReader);
        }
      } catch (error) {
        console.error('Dataset upload failed:', error);
      }
    },
    listDatasets() {
      // Implement the logic to handle dataset listing
      // called after successful dataset addition and on refresh

      fetch('http://localhost:4321/datasets').then((response) => {
        if (response.status === 200) {
          response.json().then((data) => {
            this.uploadedDatasets = data.result;
            console.log('this.uploadedDatasets :', this.uploadedDatasets);
          });
        } else {
          console.error('Dataset listing failed');
        }
      });
    },
    deleteDataset() {
      // Implement the logic to handle dataset deletion
      // Use the 'this.file' variable to access the uploaded file
      // listDatasets() should be called after successful deletion
      try {
        // Assuming this.datasetId is the ID of the dataset you want to remove
        if (this.removeID) {
          fetch(`http://localhost:4321/dataset/${this.removeID}`, {
            method: 'DELETE',
          }).then(async (response) => {
            if (response.status === 200) {
              console.log('Dataset removed successfully');
              this.removeDatasetErrorMessage = "Dataset removed successfully";
              this.listDatasets();
            } else {
              const errorResponse = await response.json();
              this.removeDatasetErrorMessage = errorResponse.error;
              console.log('Dataset removal failed:', errorResponse);
            }
          }).catch((err) => {
            console.error(err);
          });
        }
      } catch (error) {
        console.error('Dataset removal failed:', error);
      }
    },
  },
};
</script>
