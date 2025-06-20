import React, { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/router";
import ConnectWallet from "../components/connectwallet";
import { useWallet } from "../contexts/WalletContext";

const KYCForm = () => {
  const router = useRouter();
  // Header state
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const { isConnected, walletAddress, walletType, disconnect } = useWallet();

  // Function to truncate wallet address for display
  const truncateAddress = (address) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Multi-step form state
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const totalSteps = 5;

  const [formData, setFormData] = useState({
    // Personal Information - aligned with backend
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    nationality: "",
    phoneNumber: "",
    email: "",
    gender: "",
    placeOfBirth: "",

    // Identity Document - aligned with backend
    identityDocType: "",
    identityDocument: null,
    documentNumber: "",
    issueDate: "",
    expiryDate: "",

    // Address Information - aligned with backend
    street: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    addressDocument: null,

    // Financial Information - aligned with backend
    incomeRange: "",
    employmentStatus: "",
    sourceOfFunds: "",
    employer: "",
    payslip: null,

    // Consents - aligned with backend
    dataProcessing: false,
    kycVerification: false,
    dataSharing: false,
    termsOfService: false,
    privacyPolicy: false,
  });

  const [errors, setErrors] = useState({});

  const countries = [
    "United States",
    "United Kingdom",
    "Canada",
    "Australia",
    "Germany",
    "France",
    "Spain",
    "Italy",
    "Netherlands",
    "Sweden",
    "Norway",
    "Japan",
    "South Korea",
    "Singapore",
    "India",
    "Brazil",
    "Mexico",
  ];

  const incomeRanges = [
    "0-20000",
    "20000-50000",
    "50000-75000",
    "75000-100000",
    "100000-200000",
    "200000+",
  ];

  const employmentStatuses = [
    "employed",
    "self-employed",
    "student",
    "unemployed",
    "retired",
  ];

  const genderOptions = ["male", "female", "other", "prefer-not-to-say"];

  const sourceOfFundsOptions = [
    "salary",
    "business-income",
    "investments",
    "inheritance",
    "savings",
    "other",
  ];

  const handleInputChange = (e) => {
    e.preventDefault(); // Prevent any default form behaviors
    const { name, value, type, checked, files } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? checked : type === "file" ? files[0] : value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Step validation functions - DISABLED FOR EASY TESTING
  const validateStep = (step) => {
    // No validation - always return true for easy testing
    setErrors({});
    return true;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // Backend integration function
  const submitKYCData = async (kycData) => {
    console.log("🚀 Submitting KYC Data to real system:", kycData);

    try {
      const response = await fetch("/api/kyc-submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(kycData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      if (!result.success) {
        throw new Error(result.error || "KYC submission failed");
      }

      console.log("✅ KYC submission successful:", result);

      return {
        did: result.did,
        address: result.address,
        verifiableCredentials: result.verifiableCredentials,
        publishResult: result.publishResult,
        kycTimestamp: result.kycTimestamp,
      };
    } catch (error) {
      console.error("❌ KYC submission failed:", error);
      throw new Error(`KYC submission failed: ${error.message}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Only allow submission on step 5 when explicitly clicked
    if (currentStep !== totalSteps) {
      console.log("❌ Submit blocked - not on final step");
      return;
    }

    if (!validateStep(currentStep)) {
      return;
    }

    console.log("🚀 Manual form submission triggered");
    setIsSubmitting(true);
    try {
      // Transform frontend data to backend format
      const kycData = transformToBackendFormat(formData);

      console.log("KYC Form Submitted:", kycData);

      // Submit to backend and create DID
      const result = await submitKYCData(kycData);

      setSubmitResult(result);
      setCurrentStep(totalSteps + 1); // Show success step
    } catch (error) {
      console.error("KYC submission error:", error);
      alert(`KYC submission failed: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Transform frontend form data to backend-expected format
  const transformToBackendFormat = (formData) => {
    return {
      personalInfo: {
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth: formData.dateOfBirth,
        nationality: formData.nationality,
        phoneNumber: formData.phoneNumber,
        email: formData.email,
        gender: formData.gender,
        placeOfBirth: formData.placeOfBirth,
      },
      identityDocuments: [
        {
          type:
            formData.identityDocType === "national_id"
              ? "government_id"
              : formData.identityDocType,
          documentNumber: formData.documentNumber,
          issueDate: formData.issueDate,
          expiryDate: formData.expiryDate,
          file: formData.identityDocument,
        },
      ],
      addressData: {
        street: formData.street,
        city: formData.city,
        state: formData.state,
        postalCode: formData.postalCode,
        country: formData.country,
      },
      addressProofDocument: {
        type: "utility_bill",
        issueDate: new Date().toISOString().split("T")[0],
        file: formData.addressDocument,
      },
      financialInfo: {
        incomeRange: formData.incomeRange,
        employmentStatus: formData.employmentStatus,
        sourceOfFunds: formData.sourceOfFunds,
        employer: formData.employer,
      },
      consents: {
        dataProcessing: formData.dataProcessing,
        kycVerification: formData.kycVerification,
        dataSharing: formData.dataSharing,
        termsOfService: formData.termsOfService,
        privacyPolicy: formData.privacyPolicy,
        ipAddress: "unknown",
      },
    };
  };

  // Progress steps configuration
  const steps = [
    { number: 1, title: "Personal Information", icon: "👤" },
    { number: 2, title: "Identity Documents", icon: "🆔" },
    { number: 3, title: "Address Verification", icon: "🏠" },
    { number: 4, title: "Financial Information", icon: "💰" },
    { number: 5, title: "Consents", icon: "✅" },
  ];

  return (
    <>
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes bounce-in {
          0% {
            opacity: 0;
            transform: scale(0.3);
          }
          50% {
            opacity: 1;
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            transform: scale(1);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        .animate-bounce-in {
          animation: bounce-in 0.8s ease-out;
        }
        .hover\\:shadow-3xl:hover {
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }
      `}</style>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-white/70 border-b border-blue-100">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Left side - Logo and Title */}
            <Link
              href="/card"
              className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity duration-200"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-blue-700">
                Trade Me Baby
              </span>
            </Link>

            {/* Right side - Connect Wallet Button or Connected Address */}
            {!isConnected ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-2 rounded-full border border-blue-200 bg-white/80 text-blue-700 font-semibold hover:bg-blue-50 transition-all duration-300 flex items-center space-x-2"
                onClick={() => setWalletModalOpen(true)}
              >
                <svg
                  className="w-5 h-5 text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <span>Connect Wallet</span>
              </motion.button>
            ) : (
              <div className="flex items-center space-x-2">
                <div className="px-4 py-2 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-medium flex items-center space-x-2">
                  <img
                    src={
                      walletType === "crossmark" ? "/crossmart.png" : "/fox.png"
                    }
                    alt={walletType}
                    className="w-5 h-5"
                  />
                  <span>{truncateAddress(walletAddress)}</span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={disconnect}
                  className="p-2 rounded-full hover:bg-red-50 text-red-500 transition-colors"
                  title="Disconnect Wallet"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </motion.button>
              </div>
            )}
          </div>
        </div>
      </header>
      <ConnectWallet
        open={walletModalOpen}
        onClose={() => setWalletModalOpen(false)}
      />

      <div className="min-h-screen bg-white py-8 px-4 pt-24">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 p-8 bg-blue-600 text-white rounded-2xl shadow-2xl transform hover:scale-105 transition-all duration-300 border border-blue-200">
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              🔐 Know Your Customer (KYC) Verification
            </h1>
            <p className="text-lg opacity-90 animate-fade-in">
              Complete all sections to verify your identity and receive your DID
            </p>
          </div>

          {/* Success Page */}
          {currentStep === totalSteps + 1 && submitResult && (
            <div className="bg-white rounded-2xl shadow-2xl p-8 text-center border border-blue-200 transform animate-bounce-in">
              <div className="mb-6">
                <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg animate-pulse">
                  <span className="text-5xl animate-bounce">🎉</span>
                </div>
                <h2 className="text-3xl font-bold text-blue-600 mb-2">
                  KYC Verification Complete!
                </h2>
                <p className="text-gray-600 text-lg">
                  Your identity has been verified and your DID has been created
                  successfully.
                </p>
              </div>

              <div className="bg-blue-50 rounded-xl p-6 mb-6 border border-blue-200 shadow-inner">
                <h3 className="font-semibold text-blue-800 mb-4 text-lg">
                  ✨ Your Digital Identity
                </h3>
                <div className="text-sm text-left space-y-3 text-gray-700">
                  <div className="flex items-center p-2 bg-white rounded-lg shadow-sm">
                    <span className="font-semibold text-blue-600 w-20">
                      DID:
                    </span>
                    <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded flex-1">
                      {submitResult.did}
                    </span>
                  </div>
                  <div className="flex items-center p-2 bg-white rounded-lg shadow-sm">
                    <span className="font-semibold text-blue-600 w-20">
                      Address:
                    </span>
                    <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded flex-1">
                      {submitResult.address}
                    </span>
                  </div>
                  <div className="flex items-center p-2 bg-white rounded-lg shadow-sm">
                    <span className="font-semibold text-blue-600 w-20">
                      Transaction:
                    </span>
                    <a
                      href={submitResult.publishResult.explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-800 underline font-mono text-xs bg-gray-100 px-2 py-1 rounded flex-1 hover:bg-indigo-50 transition-colors"
                    >
                      {submitResult.publishResult.transactionHash}
                    </a>
                  </div>
                  <div className="flex items-center p-2 bg-white rounded-lg shadow-sm">
                    <span className="font-semibold text-blue-600 w-20">
                      Credentials:
                    </span>
                    <span className="text-green-600 font-semibold">
                      {submitResult.verifiableCredentials.length} types issued
                    </span>
                  </div>
                </div>

                {/* Generate Debit Card Button */}
                <div className="mt-6">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => router.push("/create")}
                    className="w-full px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-xl font-semibold text-lg shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all duration-300 flex items-center justify-center space-x-3"
                  >
                    <span>💳 Generate Debit Card</span>
                  </motion.button>
                </div>
              </div>
            </div>
          )}

          {/* Main Form */}
          {currentStep <= totalSteps && (
            <>
              {/* Progress Indicator */}
              <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border border-blue-200">
                <div className="flex items-center justify-between mb-4">
                  {steps.map((step, index) => (
                    <div key={step.number} className="flex items-center">
                      <div
                        className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-semibold transition-all duration-300 transform ${
                          currentStep >= step.number
                            ? "bg-blue-600 text-white shadow-lg scale-110"
                            : currentStep === step.number
                            ? "bg-blue-100 text-blue-600 border-2 border-blue-500 shadow-md animate-pulse"
                            : "bg-gray-200 text-gray-500 hover:bg-gray-300"
                        }`}
                      >
                        {currentStep > step.number ? "✓" : step.icon}
                      </div>
                      <div className="ml-3 hidden md:block">
                        <p
                          className={`text-xs font-medium transition-colors duration-300 ${
                            currentStep >= step.number
                              ? "text-blue-600"
                              : currentStep === step.number
                              ? "text-indigo-600 font-semibold"
                              : "text-gray-500"
                          }`}
                        >
                          {step.title}
                        </p>
                      </div>
                      {index < steps.length - 1 && (
                        <div
                          className={`w-6 h-1 mx-3 rounded-full transition-all duration-500 ${
                            currentStep > step.number
                              ? "bg-blue-600 shadow-sm"
                              : "bg-gray-300"
                          }`}
                        />
                      )}
                    </div>
                  ))}
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-blue-600">
                    Step {currentStep} of {totalSteps}:{" "}
                    {steps[currentStep - 1]?.title}
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500 shadow-sm"
                      style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Form Content */}
              <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-blue-200 transform hover:shadow-3xl transition-all duration-300">
                <form onSubmit={(e) => e.preventDefault()}>
                  <div className="p-8">
                    {/* Step 1: Personal Information */}
                    {currentStep === 1 && (
                      <div className="animate-fade-in">
                        <h2 className="text-2xl font-bold text-blue-600 mb-6 flex items-center">
                          <span className="text-3xl mr-3 animate-bounce">
                            👤
                          </span>
                          Personal Information
                        </h2>
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label
                                htmlFor="firstName"
                                className="block text-sm font-medium text-gray-700 mb-2"
                              >
                                First Name
                              </label>
                              <input
                                type="text"
                                id="firstName"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-black"
                              />
                            </div>
                            <div>
                              <label
                                htmlFor="lastName"
                                className="block text-sm font-medium text-gray-700 mb-2"
                              >
                                Last Name
                              </label>
                              <input
                                type="text"
                                id="lastName"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-black"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label
                                htmlFor="dateOfBirth"
                                className="block text-sm font-medium text-gray-700 mb-2"
                              >
                                Date of Birth
                              </label>
                              <input
                                type="date"
                                id="dateOfBirth"
                                name="dateOfBirth"
                                value={formData.dateOfBirth}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-black"
                              />
                            </div>
                            <div>
                              <label
                                htmlFor="gender"
                                className="block text-sm font-medium text-gray-700 mb-2"
                              >
                                Gender
                              </label>
                              <select
                                id="gender"
                                name="gender"
                                value={formData.gender}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-black"
                              >
                                <option value="">Select gender</option>
                                {genderOptions.map((gender) => (
                                  <option key={gender} value={gender}>
                                    {gender}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label
                                htmlFor="nationality"
                                className="block text-sm font-medium text-gray-700 mb-2"
                              >
                                Nationality
                              </label>
                              <select
                                id="nationality"
                                name="nationality"
                                value={formData.nationality}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-black"
                              >
                                <option value="">Select nationality</option>
                                {countries.map((country) => (
                                  <option key={country} value={country}>
                                    {country}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label
                                htmlFor="placeOfBirth"
                                className="block text-sm font-medium text-gray-700 mb-2"
                              >
                                Place of Birth
                              </label>
                              <input
                                type="text"
                                id="placeOfBirth"
                                name="placeOfBirth"
                                value={formData.placeOfBirth}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-black"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label
                                htmlFor="email"
                                className="block text-sm font-medium text-gray-700 mb-2"
                              >
                                Email Address
                              </label>
                              <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-black"
                              />
                            </div>
                            <div>
                              <label
                                htmlFor="phoneNumber"
                                className="block text-sm font-medium text-gray-700 mb-2"
                              >
                                Phone Number
                              </label>
                              <input
                                type="tel"
                                id="phoneNumber"
                                name="phoneNumber"
                                value={formData.phoneNumber}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-black"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 2: Identity Documents */}
                    {currentStep === 2 && (
                      <div className="animate-fade-in">
                        <h2 className="text-2xl font-bold text-blue-600 mb-6 flex items-center">
                          <span className="text-3xl mr-3 animate-bounce">
                            🆔
                          </span>
                          Identity Documents
                        </h2>
                        <div className="space-y-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                              Document Type
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {[
                                { value: "passport", label: "Passport" },
                                { value: "national_id", label: "National ID" },
                                {
                                  value: "drivers_license",
                                  label: "Driver's License",
                                },
                              ].map((doc) => (
                                <label
                                  key={doc.value}
                                  className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50"
                                >
                                  <input
                                    type="radio"
                                    name="identityDocType"
                                    value={doc.value}
                                    checked={
                                      formData.identityDocType === doc.value
                                    }
                                    onChange={handleInputChange}
                                    className="mr-3"
                                  />
                                  {doc.label}
                                </label>
                              ))}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label
                                htmlFor="documentNumber"
                                className="block text-sm font-medium text-gray-700 mb-2"
                              >
                                Document Number
                              </label>
                              <input
                                type="text"
                                id="documentNumber"
                                name="documentNumber"
                                value={formData.documentNumber}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-black"
                              />
                            </div>
                          </div>

                          <div>
                            <label
                              htmlFor="identityDocument"
                              className="block text-sm font-medium text-gray-700 mb-2"
                            >
                              Upload Document
                            </label>
                            <input
                              type="file"
                              id="identityDocument"
                              name="identityDocument"
                              onChange={handleInputChange}
                              accept="image/*,.pdf"
                              className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 cursor-pointer text-black"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 3: Address Verification */}
                    {currentStep === 3 && (
                      <div className="animate-fade-in">
                        <h2 className="text-xl font-semibold text-gray-800 mb-6">
                          🏠 Address Verification
                        </h2>
                        <div className="space-y-6">
                          <div>
                            <label
                              htmlFor="street"
                              className="block text-sm font-medium text-gray-700 mb-2"
                            >
                              Street Address
                            </label>
                            <input
                              type="text"
                              id="street"
                              name="street"
                              value={formData.street}
                              onChange={handleInputChange}
                              placeholder="123 Main Street"
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-black"
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label
                                htmlFor="city"
                                className="block text-sm font-medium text-gray-700 mb-2"
                              >
                                City
                              </label>
                              <input
                                type="text"
                                id="city"
                                name="city"
                                value={formData.city}
                                onChange={handleInputChange}
                                placeholder="New York"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-black"
                              />
                            </div>
                            <div>
                              <label
                                htmlFor="state"
                                className="block text-sm font-medium text-gray-700 mb-2"
                              >
                                State/Province
                              </label>
                              <input
                                type="text"
                                id="state"
                                name="state"
                                value={formData.state}
                                onChange={handleInputChange}
                                placeholder="NY"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-black"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label
                                htmlFor="postalCode"
                                className="block text-sm font-medium text-gray-700 mb-2"
                              >
                                Postal Code
                              </label>
                              <input
                                type="text"
                                id="postalCode"
                                name="postalCode"
                                value={formData.postalCode}
                                onChange={handleInputChange}
                                placeholder="10001"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-black"
                              />
                            </div>
                            <div>
                              <label
                                htmlFor="country"
                                className="block text-sm font-medium text-gray-700 mb-2"
                              >
                                Country
                              </label>
                              <select
                                id="country"
                                name="country"
                                value={formData.country}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-black"
                              >
                                <option value="">Select country</option>
                                {countries.map((country) => (
                                  <option key={country} value={country}>
                                    {country}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div>
                            <label
                              htmlFor="addressDocument"
                              className="block text-sm font-medium text-gray-700 mb-2"
                            >
                              Upload Address Proof
                            </label>
                            <p className="text-gray-600 mb-3 text-sm">
                              Upload a utility bill, bank statement, or
                              government letter (dated within last 3 months)
                            </p>
                            <input
                              type="file"
                              id="addressDocument"
                              name="addressDocument"
                              onChange={handleInputChange}
                              accept="image/*,.pdf"
                              className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 cursor-pointer text-black"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 4: Financial Information */}
                    {currentStep === 4 && (
                      <div className="animate-fade-in">
                        <h2 className="text-xl font-semibold text-gray-800 mb-6">
                          💰 Financial Information
                        </h2>
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label
                                htmlFor="incomeRange"
                                className="block text-sm font-medium text-gray-700 mb-2"
                              >
                                Annual Income Range
                              </label>
                              <select
                                id="incomeRange"
                                name="incomeRange"
                                value={formData.incomeRange}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-black"
                              >
                                <option value="">Select income range</option>
                                {incomeRanges.map((range) => (
                                  <option key={range} value={range}>
                                    $
                                    {range
                                      .replace("-", " - $")
                                      .replace("+", "+")}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label
                                htmlFor="employmentStatus"
                                className="block text-sm font-medium text-gray-700 mb-2"
                              >
                                Employment Status
                              </label>
                              <select
                                id="employmentStatus"
                                name="employmentStatus"
                                value={formData.employmentStatus}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-black"
                              >
                                <option value="">Select status</option>
                                {employmentStatuses.map((status) => (
                                  <option key={status} value={status}>
                                    {status.charAt(0).toUpperCase() +
                                      status.slice(1).replace("-", " ")}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label
                                htmlFor="sourceOfFunds"
                                className="block text-sm font-medium text-gray-700 mb-2"
                              >
                                Source of Funds
                              </label>
                              <select
                                id="sourceOfFunds"
                                name="sourceOfFunds"
                                value={formData.sourceOfFunds}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-black"
                              >
                                <option value="">Select source</option>
                                {sourceOfFundsOptions.map((source) => (
                                  <option key={source} value={source}>
                                    {source.charAt(0).toUpperCase() +
                                      source.slice(1).replace("-", " ")}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label
                                htmlFor="employer"
                                className="block text-sm font-medium text-gray-700 mb-2"
                              >
                                Employer (Optional)
                              </label>
                              <input
                                type="text"
                                id="employer"
                                name="employer"
                                value={formData.employer}
                                onChange={handleInputChange}
                                placeholder="Company name"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-black"
                              />
                            </div>
                          </div>

                          <div>
                            <label
                              htmlFor="payslip"
                              className="block text-sm font-medium text-gray-700 mb-2"
                            >
                              Payslip Upload (Optional)
                            </label>
                            <p className="text-gray-600 mb-3 text-sm">
                              Upload your most recent payslip for verification
                            </p>
                            <input
                              type="file"
                              id="payslip"
                              name="payslip"
                              onChange={handleInputChange}
                              accept="image/*,.pdf"
                              className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 cursor-pointer text-black"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 5: Consents */}
                    {currentStep === 5 && (
                      <div className="animate-fade-in">
                        <h2 className="text-2xl font-bold text-blue-600 mb-6 flex items-center">
                          <span className="text-3xl mr-3 animate-bounce">
                            ✅
                          </span>
                          Consents & Declarations
                        </h2>
                        <div className="space-y-6">
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                            <p className="text-blue-800 text-sm">
                              Please review and accept all consents below to
                              complete your KYC verification and create your
                              DID.
                            </p>
                          </div>

                          <div className="space-y-4">
                            <label className="flex items-start cursor-pointer p-4 border rounded-lg hover:bg-gray-50">
                              <input
                                type="checkbox"
                                name="dataProcessing"
                                checked={formData.dataProcessing}
                                onChange={handleInputChange}
                                className="mt-1 mr-3 text-indigo-600 focus:ring-indigo-500"
                              />
                              <div>
                                <span className="font-medium text-gray-800">
                                  Data Processing Consent
                                </span>
                                <p className="text-sm text-gray-600 mt-1">
                                  I consent to the processing of my personal
                                  data for KYC verification purposes.
                                </p>
                              </div>
                            </label>

                            <label className="flex items-start cursor-pointer p-4 border rounded-lg hover:bg-gray-50">
                              <input
                                type="checkbox"
                                name="kycVerification"
                                checked={formData.kycVerification}
                                onChange={handleInputChange}
                                className="mt-1 mr-3 text-indigo-600 focus:ring-indigo-500"
                              />
                              <div>
                                <span className="font-medium text-gray-800">
                                  KYC Verification Consent
                                </span>
                                <p className="text-sm text-gray-600 mt-1">
                                  I agree to undergo identity verification and
                                  authorize third-party verification services.
                                </p>
                              </div>
                            </label>

                            <label className="flex items-start cursor-pointer p-4 border rounded-lg hover:bg-gray-50">
                              <input
                                type="checkbox"
                                name="dataSharing"
                                checked={formData.dataSharing}
                                onChange={handleInputChange}
                                className="mt-1 mr-3 text-indigo-600 focus:ring-indigo-500"
                              />
                              <div>
                                <span className="font-medium text-gray-800">
                                  Data Sharing Consent
                                </span>
                                <p className="text-sm text-gray-600 mt-1">
                                  I consent to share my verified information
                                  with authorized financial institutions and
                                  exchanges.
                                </p>
                              </div>
                            </label>

                            <label className="flex items-start cursor-pointer p-4 border rounded-lg hover:bg-gray-50">
                              <input
                                type="checkbox"
                                name="termsOfService"
                                checked={formData.termsOfService}
                                onChange={handleInputChange}
                                className="mt-1 mr-3 text-indigo-600 focus:ring-indigo-500"
                              />
                              <div>
                                <span className="font-medium text-gray-800">
                                  Terms of Service
                                </span>
                                <p className="text-sm text-gray-600 mt-1">
                                  I have read and agree to the{" "}
                                  <a
                                    href="#"
                                    className="text-indigo-600 hover:underline"
                                  >
                                    Terms of Service
                                  </a>
                                  .
                                </p>
                              </div>
                            </label>

                            <label className="flex items-start cursor-pointer p-4 border rounded-lg hover:bg-gray-50">
                              <input
                                type="checkbox"
                                name="privacyPolicy"
                                checked={formData.privacyPolicy}
                                onChange={handleInputChange}
                                className="mt-1 mr-3 text-indigo-600 focus:ring-indigo-500"
                              />
                              <div>
                                <span className="font-medium text-gray-800">
                                  Privacy Policy
                                </span>
                                <p className="text-sm text-gray-600 mt-1">
                                  I have read and agree to the{" "}
                                  <a
                                    href="#"
                                    className="text-indigo-600 hover:underline"
                                  >
                                    Privacy Policy
                                  </a>
                                  .
                                </p>
                              </div>
                            </label>
                          </div>

                          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
                            <p className="text-green-800 text-sm">
                              🎉 Once you submit, your KYC verification will be
                              processed and your unique DID (Decentralized
                              Identity) will be created and published to the
                              XRPL network.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Navigation Buttons */}
                  <div className="px-8 py-6 bg-white flex justify-between border-t border-blue-200">
                    <button
                      type="button"
                      onClick={prevStep}
                      disabled={currentStep === 1}
                      className={`px-8 py-3 rounded-xl font-semibold transition-all duration-300 transform ${
                        currentStep === 1
                          ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300 hover:scale-105 shadow-md hover:shadow-lg"
                      }`}
                    >
                      ← Previous
                    </button>

                    {currentStep < totalSteps ? (
                      <button
                        type="button"
                        onClick={nextStep}
                        className="px-8 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                      >
                        Next →
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          console.log("🎯 Submit button clicked explicitly");
                          handleSubmit(e);
                        }}
                        disabled={isSubmitting}
                        className={`px-8 py-3 rounded-xl font-semibold transition-all duration-300 transform ${
                          isSubmitting
                            ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                            : "bg-green-600 text-white hover:bg-green-700 hover:scale-105 shadow-lg hover:shadow-xl animate-pulse"
                        }`}
                      >
                        {isSubmitting ? (
                          <span className="flex items-center">
                            <svg
                              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            Submitting...
                          </span>
                        ) : (
                          "🚀 Submit KYC"
                        )}
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default KYCForm;
