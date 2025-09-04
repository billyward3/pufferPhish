"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PufferPhishStack = void 0;
const cdk = require("aws-cdk-lib");
class PufferPhishStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        // Placeholder stack - infrastructure will be added incrementally
        new cdk.CfnOutput(this, 'StackName', {
            value: this.stackName,
            description: 'Name of the deployed stack'
        });
    }
}
exports.PufferPhishStack = PufferPhishStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHVmZmVycGhpc2gtc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJwdWZmZXJwaGlzaC1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxtQ0FBbUM7QUFHbkMsTUFBYSxnQkFBaUIsU0FBUSxHQUFHLENBQUMsS0FBSztJQUM3QyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQXNCO1FBQzlELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLGlFQUFpRTtRQUNqRSxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLFdBQVcsRUFBRTtZQUNuQyxLQUFLLEVBQUUsSUFBSSxDQUFDLFNBQVM7WUFDckIsV0FBVyxFQUFFLDRCQUE0QjtTQUMxQyxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUFWRCw0Q0FVQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcblxuZXhwb3J0IGNsYXNzIFB1ZmZlclBoaXNoU3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wcz86IGNkay5TdGFja1Byb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XG5cbiAgICAvLyBQbGFjZWhvbGRlciBzdGFjayAtIGluZnJhc3RydWN0dXJlIHdpbGwgYmUgYWRkZWQgaW5jcmVtZW50YWxseVxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdTdGFja05hbWUnLCB7XG4gICAgICB2YWx1ZTogdGhpcy5zdGFja05hbWUsXG4gICAgICBkZXNjcmlwdGlvbjogJ05hbWUgb2YgdGhlIGRlcGxveWVkIHN0YWNrJ1xuICAgIH0pO1xuICB9XG59Il19