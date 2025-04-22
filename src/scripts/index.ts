// Import the main.scss file
import '../styles/main.scss';
import { initMemberComponent } from './memberComponent';

/** Our main application class, extend this as needed. */
class Main {
  private readonly verificationLog: string = "Hello world!";

  constructor() {
    // Verify the application is running as intended
    console.log(this.verificationLog);

    // Initialize the member component
    initMemberComponent();
  }
}

new Main();