import { useNavigate } from "react-router-dom";

const WelcomePage = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen w-screen flex  items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100 p-10 relative">
      <div className="sm:max-w-xl max-w-[90vw]  p-8 bg-white rounded-lg shadow-xl text-center ">
        <h2 className="text-2xl font-bold text-blue-600 mb-4">
          Welcome to OrderPing
        </h2>
        <p className="text-gray-700 mb-5">
          Please scan a QR code from a food cart to find and track your order.
        </p>
        <div className="flex justify-center mb-6">
          <img
            className="mx-auto max-h-[50vh] max-w-[80%]"
            src="/fast-food-svgrepo-com.svg"
            alt="Food Cart Illustration"
          />
        </div>
        <div className="mt-4 pb-6  text-sm text-gray-500">
          <p className="">Scan any OrderPing QR code to get started</p>
        </div>

        {/* Subtle Login Link */}
        <div className=" text-center">
          <p className="text-sm text-gray-600">
            Are you a worker?{" "}
            <button
              onClick={() => navigate("/login")}
              className="text-blue-600 hover:text-blue-700 font-medium underline transition-colors"
            >
              Login here
            </button>
          </p>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-4 text-center text-xs text-gray-400">
        <p>Contact: usalife609@gmail.com</p>
      </div>
    </div>
  );
};

export default WelcomePage;
