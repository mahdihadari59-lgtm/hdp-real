const axios = require('axios');

class NeshanService {
  constructor() {
    this.apiKey = 'service.a26822ae11b84924a29a13225498abf0';
    this.baseURL = 'https://api.neshan.org';
  }

  async getRoute(origin, destination) {
    try {
      const response = await axios.get(`${this.baseURL}/v4/direction`, {
        params: {
          type: 'car',
          origin: `${origin.lat},${origin.lng}`,
          destination: `${destination.lat},${destination.lng}`
        },
        headers: { 'Api-Key': this.apiKey }
      });
      return response.data;
    } catch (error) {
      console.error('خطا در مسیریابی:', error.message);
      return null;
    }
  }

  async searchAddress(query) {
    try {
      const response = await axios.get(`${this.baseURL}/v1/search`, {
        params: { term: query },
        headers: { 'Api-Key': this.apiKey }
      });
      return response.data.items || [];
    } catch (error) {
      console.error('خطا در جستجو:', error.message);
      return [];
    }
  }
}

module.exports = new NeshanService();
