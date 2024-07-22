const express = require("express");
const app = express();
const PORT = 4444;
const path = require("path");
const hbs = require("hbs");
require("dotenv").config();

app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.set("view engine", "hbs");

const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.API_KEY);

app.post("/crop", (req, res) => {
  const { soil, location, temperature } = req.body;

  async function run() {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const partsCropSuitability = [
      {
        text: `On the basis of the given features:

                1. *Crop Suitability Assessment*
                
                Given that the location of ones cultivating land is in ${location}, the soil type is ${soil}, along with a temperature range of ${temperature} in Celsius. Suggest suitable crops that can be grown in different seasons based on the following:
                
                - Pre-determined crop suitability guidelines for different soil types and climates.
                - Historical agricultural data and best practices for the region.
                - Potential market demand for specific crops.
                
                Provide the result as a JSON object in the following format:
                "
                {
                    crops: [
                        {
                            "crop_name": "String",
                            "features": ["String"]
                        }
                    ],
                    AdditionalConsiderations: ["String"]
                }
                "     
                Ensure that there are no errors in the response JSON Object and try to make it as parsable as possible.
                There should be no extraneous punctuations attached to the JSON Object. Don't respond with unexpected tokens before and after the json format to avoid any syntactical errors, do not give bullet points in the features under crop_name.
                `,
      },
    ];

    const resultCropSuitability = await model.generateContent({
      contents: [{ role: "user", parts: partsCropSuitability }],
    });

    let cropSuitabilityData = JSON.parse(resultCropSuitability.response.text());

    const irrigationRequests = cropSuitabilityData.crops.map((crop) => ({
      text: `On the basis of the given features:

            1. *Irrigation Schedule Recommendations*
            
            Given that the crop type chosen is ${crop.crop_name} kind, nature of soil being ${soil} and location of land being in ${location} hence the related weather to that location. Suggest irrigation recommendations along with the following features according to the data mentioned above:
            
            - Suggested watering frequency and duration.
            - Estimated water quantity required per irrigation cycle.
            - Considerations for adjusting schedules based on rainfall and temperature fluctuations.
            
            Provide the result as a JSON object in the following format:
            "
            {
                irrigation_schedule: {
                    "watering_frequency": "String",
                    "water_quantity_per_cycle": "String",
                    "adjustments_based_on_weather": ["String"]
                }
            }
            "     
            Ensure that there are no errors in the response JSON Object and try to make it as parsable as possible.
            There should be no extraneous punctuations attached to the JSON Object. Don't respond with unexpected tokens before and after the json format to avoid any syntactical errors.
            `,
    }));

    const irrigationResponses = await Promise.all(
      irrigationRequests.map((partsIrrigation) =>
        model.generateContent({
          contents: [{ role: "user", parts: [partsIrrigation] }],
        })
      )
    );

    let irrigationData = irrigationResponses.map((response) =>
      JSON.parse(response.response.text())
    );

    const partsResourceManagement = [
      {
        text: `Provide educational resources and best practices on:
                
                - Efficient irrigation methods (e.g., drip irrigation, rainwater harvesting).
                - Fertilizer application techniques (e.g., soil testing, balanced fertilization).
                - Integrated Pest Management (IPM) strategies to minimize pesticide use.
                - Soil health improvement practices (e.g., cover cropping, composting).
                
                Provide the result as a JSON object in the following format:
                "
                {
                    resource_management_tips: [
                        {
                            "topic": "String",
                            "tips": ["String"]
                        }
                    ]
                }
                "     
                Ensure that there are no errors in the response JSON Object and try to make it as parsable as possible.
                There should be no extraneous punctuations attached to the JSON Object. Don't respond with unexpected tokens before and after the json format to avoid any syntactical errors.
                `,
      },
    ];

    const resultResourceManagement = await model.generateContent({
      contents: [{ role: "user", parts: partsResourceManagement }],
    });

    let resourceManagementData = JSON.parse(
      resultResourceManagement.response.text()
    );

    const irrigationDataWithCropNames = cropSuitabilityData.crops.map(
      (crop, index) => ({
        crop_name: crop.crop_name,
        irrigation_schedule: irrigationData[index].irrigation_schedule,
      })
    );

    res.render("data", {
      cropData: cropSuitabilityData,
      irrigationData: irrigationDataWithCropNames,
      resourceManagementData: resourceManagementData,
    });
  }

  run();
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
