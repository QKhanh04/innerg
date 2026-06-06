# Stage 1: Build and Publish the application
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy the project file and restore dependencies
COPY ["InnerG.Api.csproj", "./"]
RUN dotnet restore "./InnerG.Api.csproj"

# Copy the rest of the source code and build/publish
COPY . .
RUN dotnet publish "InnerG.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Stage 2: Create the final runtime image
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app

# Copy the published output from the build stage
COPY --from=build /app/publish .

# Expose port 8080 which is default in .NET 8+ inside containers
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

ENTRYPOINT ["dotnet", "InnerG.Api.dll"]
