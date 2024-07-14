const express = require("express");
const app = express();
const PORT = 4444;
const path = require("path");
const hbs = require("hbs");

require("dotenv").config();

const { GoogleGenerativeAI } = require("@google/generative-ai");
const { text, json } = require("body-parser");

// Access your API key as an environment variable (see "Set up your API key" above)
const genAI = new GoogleGenerativeAI(process.env.API_KEY);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set("view engine", "hbs");

// ...

// For text-only input, use the gemini-pro model
/*async function run (){
const model = genAI.getGenerativeModel({ model: "gemini-pro"});*/

app.use(express.static(path.join(__dirname, "public")));

app.post("/crop", (req, res) => {
  const { soil, location, temperature } = req.body;
  console.log(soil,location,temperature)
  let c;

  async function run() {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const parts = [
      {
        text:
`Based on the given features, provide a crop suitability assessment in a clear bullet-point format without using bold symbols. The location is ${location}, the soil type is ${soil}, and the temperature range is ${temperature} Celsius. The output should include suitable crops for different seasons, historical agricultural data, best practices, and potential market demand. 
      Strictly Follow the Given Format Don't Improvise according to you and Most Importantly Don't use any type of symbols specially **.
      Format:
      - Pre-determined crop suitability guidelines for different soil types and climates:
      *leave a line*
        - Soil type: ${soil}
        *leave a line*
        - Climate: Temperature range of ${temperature} degrees Celsius
        *leave a line*
        - Suitable crops:
          - Summer (March-June):
            - Vegetables: 
            - Fruits: 
            - Field crops: 
          - Rainy season (July-September):
            - Vegetables: 
            - Fruits: 
          - Winter (October-February):
            - Vegetables: 
            - Fruits: 
            - Field crops: 
      *leave a line*
      - Historical agricultural data and best practices for the region:
        - 
      *leave a line*
        - Potential market demand for specific crops:
        - 
      *leave a line*
        - Recommended crops for cultivation in ${location}:
        - Summer: 
        - Rainy season: 
        - Winter:`,
      },
    ];

    const result = await model.generateContent({
      contents: [{ role: "user", parts }],
    });
    const response = await result.response;
    const text = response.text();
    //   console.log(text);
    // c = JSON.parse(text);
    // console.log(c);
    res.render("data", { data: text });
  }
  run();
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});

// On the basis of the given features:

// 1. **Crop Suitability Assessment**

//    Given that the location of one’s cultivating land is in ${location}, the soil type is ${soil}, along with a temperature range of ${temperature} in Celsius. Suggest suitable crops that can be grown in different seasons based on the following:

//    - Pre-determined crop suitability guidelines for different soil types and climates.
//    - Historical agricultural data and best practices for the region.
//    - Potential market demand for specific crops.

//    Provide the result as a JSON object in the following format:

//    ```json
//    {
//        "crops": [
//            {
//                "crop_name": "String",
//                "features": ["String"]
//            }
//        ],
//        "Additional Considerations": ["String"]
//    }

//My version -
// prompt-On the basis of the given features –
//             1.Crop Suitability Assessment
//             Given that the location of one’s cultivating land is in ${location}. The soil type is ${soil} along with a temperature range of ${temperature}in Celsius. Suggest suitable crops that can be grown in different seasons based on the following –

//             *Pre-determined crop suitability guidelines for different soil types and climates
//             * Historical agricultural data and best practices for the region
//             * Potential market demand for specific crops

//             Provide the result as a JSON Object  as follows :
//             {
//                 crops: String[]
//                 //Array of objects including features of each crop in the form of - {crop :{
//                     crop_name:String,
//                     features:String[]
//                     //Array of all the features pertaining to one crop
//                 }},
//                 Additional Considerations(being a key): String[]
//                 //Array of all the considerations hence provided

//             }
//             without adding anything at the start of the response and just plainly provide the required JSON Object .
//             Give a valid JS Object from the   as the response without any errors and strictly ensure that the response is a JSON object that can be used in a process and can be accessed easily. Double check it for errors, and if any remove them and respond with the best version.
