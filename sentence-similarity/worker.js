importScripts("https://unpkg.com/comlink/dist/umd/comlink.min.js");
importScripts("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest");
importScripts("https://cdn.jsdelivr.net/npm/@tensorflow-models/universal-sentence-encoder");


let model;
let data;
const load = async () => {
  const loadData = async () => {
    // fetch + cache comparison data
    const res =await fetch("https://griffa.dev/feed/feed.json");
    const feed = (await res.json());
    const data = feed.items.map((item) => {
      return {
        searchData: `${item.title} ${item.summary} ${(item.tags || []).join(", ")}`,
        title: item.title,
        description: item.summary
      }
    });
    console.log("data loaded")
    return data;
  };
  const loadModel = async () => {
    const model = await use.load();
    console.log("model loaded");
    return model;
  };
    [model, data] = await Promise.all([
        loadModel(),
        loadData()
    ])
}

//// cosine similarity fns
const dotProduct = (vector1, vector2) => {
  return vector1.reduce((product, current, index) => {
    product+= current * vector2[index];
    return product;
  }, 0)
};

const vectorMagnitude = (vector) => {
  return Math.sqrt(vector.reduce((sum, current) => {
    sum += current *  current;
    return sum;
  }, 0))
}

const cosineSimilarity = (vector1, vector2) => {
  return dotProduct(vector1, vector2) / (vectorMagnitude(vector1) * vectorMagnitude(vector2))
}
////

async function search(userInput) {
    const t0 = performance.now();
    const dataTensor = await model.embed(data.map((d) => d.searchData));
    const userInputTensor = await model.embed(userInput);
    const inputVector = await userInputTensor.array();
    const dataVector = await dataTensor.array();
  
    const MAX_RESULTS = 2;
    const allPredictions = userInput.map((input, index) => {
  
      const predictions = dataVector.map((dataEntry, dataEntryIndex) => {
        const similarity = cosineSimilarity(inputVector[index], dataEntry);
      
        return {
          similarity,
          result: data[dataEntryIndex]
        }
        // sort descending
      }).sort((a, b) => b.similarity - a.similarity).slice(0,MAX_RESULTS);
  
      return {
        "input": input,
        predictions: predictions
      }
    })
  
    allPredictions.forEach((p) => {
      console.log(`${p.input}`)
      console.table(p.predictions)
    })
  
    const t1 = performance.now();
    console.log(`Search took ${t1 - t0} milliseconds.`);
    return allPredictions
  }

const Searcher = {
    search,
    load
}

Comlink.expose(Searcher);
