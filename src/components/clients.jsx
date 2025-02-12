import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase/config';
import { collection, addDoc } from 'firebase/firestore';
import botbiLogo2 from '../assets/botbiLogo2.png';
import neighborhoods from '../data/neighborhoods';

// Add location data
const locationData = {
  México: neighborhoods
};

// Actualizar con una API key válida de Google Maps
const GOOGLE_MAPS_API_KEY = 'AIzaSyAdt9kEbALdED6sjEnEpDJcg0dAhropseg';

export default function Clients() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  

  const states = selectedCountry ? Object.keys(locationData[selectedCountry]) : [];

  const cities = selectedState ? Object.keys(locationData[selectedCountry][selectedState]) : [];

  const neighborhoods = selectedCity ? locationData[selectedCountry][selectedState][selectedCity] : [];

  const phoneValidation = {
    required: "Phone is required",
    pattern: {
      value: /^(\+52\s?)?(\d{10})$/,
      message: "Phone number must be in the format +52 or 10 digits"
    }
  };

  const getCoordinates = async (address) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          address
        )}&region=mx&language=es&key=${GOOGLE_MAPS_API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      
      if (data.status === 'ZERO_RESULTS') {
        throw new Error('Dirección no encontrada');
      }

      if (data.status !== 'OK') {
        console.error('Google Maps API response:', data);
        throw new Error('Error al obtener las coordenadas');
      }

      const { lat, lng } = data.results[0].geometry.location;
      console.log('Coordenadas encontradas:', { lat, lng });
      return { latitude: lat, longitude: lng };
    } catch (error) {
      console.error('Error al obtener coordenadas:', error);
      // En caso de error, retornamos coordenadas por defecto de México
      return {
        latitude: 23.634501,
        longitude: -102.552784
      };
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');
    try {
      const fullAddress = `${data.street} ${data.number}, ${data.neighborhood}, ${selectedCity}, ${selectedState}, ${selectedCountry} ${data.postalCode}`;
      console.log('Buscando coordenadas para:', fullAddress);

      let coordinates;
      try {
        coordinates = await getCoordinates(fullAddress);
      } catch (error) {
        console.warn('Error al obtener coordenadas:', error);
        coordinates = {
          latitude: 23.634501,
          longitude: -102.552784
        };
      }

      const addressData = {
        street: data.street,
        number: data.number,
        neighborhood: data.neighborhood,
        city: selectedCity,
        state: selectedState,
        country: selectedCountry,
        postalCode: data.postalCode,
        fullAddress,
        coordinates
      };

      const clientData = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        address: addressData,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'clients'), clientData);
      setSuccess(true);
      reset();
    } catch (error) {
      setError(`Error: ${error.message}`);
      console.error('Error adding client:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-blue-800 text-white p-4 h-16 flex items-center">
        <div className="flex items-center justify-between w-full">
          <img 
            src={botbiLogo2} 
            alt="BotBI Logo" 
            className="w-20 h-auto cursor-pointer -my-6"
            onClick={() => navigate('/')}
          />
          <h1 className="text-2xl font-bold">Gestion de clientes</h1>
          <div className="w-20"></div> {/* Spacer for alignment */}
        </div>
      </nav>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6 text-center">Agrega un nuevo cliente</h2>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {/* Personal Information */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre(s)</label>
                <input
                  {...register("firstName", { required: "First name is required" })}
                  placeholder="Carlos"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Apellido(s)</label>
                <input
                  {...register("lastName", { required: "Last name is required" })}
                  placeholder="Delgado"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  {...register("email", {
                    required: "Email es requerido",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Correo invalido"
                    }
                  })}
                  placeholder="carlos@correo.com"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Telefono</label>
                <input
                  {...register("phone", phoneValidation)}
                  placeholder="+52 55 1234 5678"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
              </div>

              {/* Address Fields */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Calle</label>
                <input
                  {...register("street", { required: "calle es necesaria" })}
                  placeholder="Calle principal 123"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                {errors.street && <p className="text-red-500 text-xs mt-1">{errors.street.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Numero</label>
                <input
                  {...register("number", { required: "Numero es requerido" })}
                  placeholder=" Apt 4B"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                {errors.number && <p className="text-red-500 text-xs mt-1">{errors.number.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">País</label>
                <select
                  {...register("country", { required: "País es requerido" })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  onChange={(e) => {
                    setSelectedCountry(e.target.value);
                    setSelectedState('');
                    setSelectedCity('');
                  }}
                >
                  <option value="">Selecciona País</option>
                  <option value="México">México</option>
                </select>
                {errors.country && <p className="text-red-500 text-xs mt-1">{errors.country.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Estado</label>
                <select
                  {...register("state", { required: "Estado es requerido" })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  onChange={(e) => {
                    setSelectedState(e.target.value);
                    setSelectedCity('');
                  }}
                  disabled={!selectedCountry}
                >
                  <option value="">Selecciona Estado</option>
                  {states.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
                {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Ciudad</label>
                <select
                  {...register("city", { required: "Ciudad es requerido " })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  onChange={(e) => setSelectedCity(e.target.value)}
                  disabled={!selectedState}
                >
                  <option value="">Selecciona Ciudad</option>
                  {cities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
                {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Colonia</label>
                <select
                  {...register("neighborhood", { required: "Colonia es requerido" })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  disabled={!selectedCity}
                >
                  <option value="">Selecciona Colonia</option>
                  {neighborhoods.map(neighborhood => (
                    <option key={neighborhood} value={neighborhood}>{neighborhood}</option>
                  ))}
                </select>
                {errors.neighborhood && <p className="text-red-500 text-xs mt-1">{errors.neighborhood.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Codigo postal</label>
                <input
                  {...register("postalCode", { required: "Codigo postal es requerido" })}
                  placeholder="2700"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                {errors.postalCode && <p className="text-red-500 text-xs mt-1">{errors.postalCode.message}</p>}
              </div>

              
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
                Cliente agregado!
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              {loading ? 'Agregando...' : 'Agregar Cliente'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}