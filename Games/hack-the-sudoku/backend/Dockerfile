FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY HackTheSudoku.Api.csproj ./
RUN dotnet restore HackTheSudoku.Api.csproj
COPY . ./
RUN dotnet publish HackTheSudoku.Api.csproj -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app/publish ./
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "HackTheSudoku.Api.dll"]
