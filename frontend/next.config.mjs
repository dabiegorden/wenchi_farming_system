/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites(){
        return[
            {
                source: "/api/:path*",
                destination: "http://localhost:5000/api/:path*"
            }
        ]
    },

    images: {
        domains: ["localhost"],
        remotePatterns: [
          {
            protocol: "http",
            hostname: "localhost",
            port: "5000",
            pathname: "/**",
          },
        ],
      },
};

export default nextConfig;
