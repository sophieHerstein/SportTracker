import Navigation from "./Navigation";
import {logErrorToFile} from "./utils/error-logger";

ErrorUtils.setGlobalHandler(async (error, isFatal) => {
    await logErrorToFile(error, { isFatal });
});

export default function App() {
    return <Navigation/>
}
